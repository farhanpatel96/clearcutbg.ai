import asyncio
import io
import logging
from typing import Optional
from PIL import Image
import rembg
from fastapi import HTTPException, status

from app.config import settings

logger = logging.getLogger("clearcut.remover")


class BackgroundRemoverService:
    """
    Manages model initialization, inference session lifecycle,
    and controlled concurrency for background removal.
    """

    def __init__(self):
        self.session = None
        self.model_name = settings.MODEL_NAME
        self.is_ready = False
        self._semaphore: Optional[asyncio.Semaphore] = None

    def initialize(self):
        """Load model session synchronously at application startup."""
        try:
            logger.info(f"Loading AI background removal model: {self.model_name}...")
            self.session = rembg.new_session(self.model_name)
            self.is_ready = True
            logger.info(f"AI model '{self.model_name}' successfully loaded and ready.")
        except Exception as e:
            logger.warning(
                f"Failed to load preferred model '{self.model_name}' ({e}). Attempting fallback to 'u2netp'..."
            )
            try:
                self.model_name = "u2netp"
                self.session = rembg.new_session("u2netp")
                self.is_ready = True
                logger.info("Fallback model 'u2netp' loaded successfully.")
            except Exception as ex:
                self.is_ready = False
                logger.error(f"Failed to load any background removal model: {ex}")

    @property
    def semaphore(self) -> asyncio.Semaphore:
        """Lazy-initialize semaphore inside active event loop."""
        if self._semaphore is None:
            self._semaphore = asyncio.Semaphore(settings.MAX_CONCURRENT_INFERENCES)
        return self._semaphore

    def _filter_main_subject(self, result_img: Image.Image) -> Image.Image:
        """
        Isolate the primary foreground subject by performing connected-component
        analysis on the alpha mask. Discards detached background photobombers,
        secondary people, and stray background artifacts.
        """
        try:
            import numpy as np
            from scipy import ndimage

            rgba = np.array(result_img)
            alpha = rgba[:, :, 3]

            binary = alpha > 15
            if not np.any(binary):
                return result_img

            h, w = binary.shape
            # Adaptive morphological closing to avoid splitting limbs, hair strands, accessories
            closing_radius = max(3, int(min(h, w) * 0.012))
            struct = ndimage.generate_binary_structure(2, 2)
            closed = ndimage.binary_closing(binary, structure=struct, iterations=closing_radius)

            labeled, num_features = ndimage.label(closed)
            if num_features <= 1:
                return result_img

            sizes = ndimage.sum(closed, labeled, range(1, num_features + 1))
            max_label = int(np.argmax(sizes) + 1)
            max_size = sizes[max_label - 1]

            keep_mask = np.zeros_like(binary, dtype=bool)
            for label_idx in range(1, num_features + 1):
                comp_size = sizes[label_idx - 1]
                if label_idx == max_label:
                    keep_mask |= (labeled == label_idx)
                    continue
                # Keep secondary components only if they are a substantial fraction
                # of the primary subject (e.g. at least 40% of max size), which allows
                # deliberate group portraits while removing distant background people.
                if comp_size >= max_size * 0.40:
                    keep_mask |= (labeled == label_idx)

            # Dilate keep mask slightly to preserve anti-aliased edge transparency
            expanded_keep = ndimage.binary_dilation(keep_mask, structure=struct, iterations=closing_radius + 2)

            cleaned_alpha = np.where(expanded_keep, alpha, 0).astype(np.uint8)
            rgba[:, :, 3] = cleaned_alpha

            return Image.fromarray(rgba, mode="RGBA")
        except Exception as e:
            logger.warning(f"Failed to apply main subject filter: {e}. Returning unfiltered result.")
            return result_img

    def _sync_remove(
        self,
        img: Image.Image,
        alpha_matting: bool = False,
        alpha_matting_foreground_threshold: int = 240,
        alpha_matting_background_threshold: int = 10,
        alpha_matting_erode_size: int = 10,
        main_subject_only: bool = False,
        post_process_mask: bool = True,
    ) -> bytes:
        """
        Synchronous worker function executed in thread pool.
        Performs AI segmentation and encodes transparent PNG into bytes.
        """
        if not self.is_ready or self.session is None:
            raise RuntimeError("AI model session is not initialized or ready.")

        # Run rembg with the preloaded session
        # Passing PIL Image returns PIL Image (RGBA)
        result_img: Image.Image = rembg.remove(
            img,
            session=self.session,
            alpha_matting=alpha_matting,
            alpha_matting_foreground_threshold=alpha_matting_foreground_threshold,
            alpha_matting_background_threshold=alpha_matting_background_threshold,
            alpha_matting_erode_size=alpha_matting_erode_size,
            post_process_mask=post_process_mask,
        )

        # Ensure mode is RGBA
        if result_img.mode != "RGBA":
            result_img = result_img.convert("RGBA")

        # Optionally isolate main subject to eliminate background people / photobombers
        if main_subject_only:
            result_img = self._filter_main_subject(result_img)

        # Encode transparent PNG in memory
        output_buffer = io.BytesIO()
        result_img.save(output_buffer, format="PNG", optimize=True)
        return output_buffer.getvalue()

    async def remove_background(
        self,
        image: Image.Image,
        alpha_matting: bool = False,
        main_subject_only: bool = False,
    ) -> bytes:
        """
        Perform AI background removal asynchronously with concurrency limiting.
        """
        if not self.is_ready:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="AI Model is still initializing or unavailable. Please try again shortly.",
            )

        # Acquire semaphore to prevent unbounded CPU/RAM overload
        try:
            # Wait up to 30 seconds for an inference slot
            await asyncio.wait_for(self.semaphore.acquire(), timeout=30.0)
        except asyncio.TimeoutError:
            raise HTTPException(
                status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
                detail="Server is busy processing other images. Please try again in a few moments.",
            )

        try:
            # Offload heavy CPU/GPU model inference to thread pool
            loop = asyncio.get_running_loop()
            png_bytes = await loop.run_in_executor(
                None,
                self._sync_remove,
                image,
                alpha_matting,
                240,
                10,
                10,
                main_subject_only,
                True,
            )
            return png_bytes
        except Exception as e:
            logger.error(f"Inference error during background removal: {e}", exc_info=True)
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to process image background. Please try another image.",
            )
        finally:
            self.semaphore.release()


# Global singleton instance
remover_service = BackgroundRemoverService()
