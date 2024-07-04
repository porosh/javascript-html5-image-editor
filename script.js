document.addEventListener("DOMContentLoaded", () => {
  const dropZone = document.getElementById("drop-zone");
  const image = document.getElementById("image");
  const selection = document.getElementById("selection");
  const handles = document.querySelectorAll(".handle");
  const cropBtn = document.getElementById("crop-btn");
  const resetBtn = document.getElementById("reset-btn");
  const clearFilterBtn = document.getElementById("clear-filter-btn");
  const clearBtn = document.getElementById("clear-btn");
  const flipHBtn = document.getElementById("flip-h-btn");
  const flipVBtn = document.getElementById("flip-v-btn");
  const rotateLeftBtn = document.getElementById("rotate-left-btn");
  const rotateRightBtn = document.getElementById("rotate-right-btn");
  const blurRange = document.getElementById("blur-range");
  const contrastRange = document.getElementById("contrast-range");
  const brightnessRange = document.getElementById("brightness-range");
  const saturationRange = document.getElementById("saturation-range");
  const hueRotateRange = document.getElementById("hue-rotate-range");
  const controlsContainer = document.querySelector(".controls-container");
  const preview = document.getElementById("preview");
  const croppedImage = document.getElementById("cropped-image");
  const filtersContainer = document.querySelector(".filters-container");
  const filtersTitle = document.getElementById("filters-title");
  const container = document.querySelector(".container");

  const filters = [
    { name: "None", value: "" },
    { name: "Grayscale", value: "grayscale(100%)" },
    { name: "Sepia", value: "sepia(100%)" },
    { name: "Blur", value: "blur(5px)" },
    { name: "Brightness", value: "brightness(150%)" },
    { name: "Contrast", value: "contrast(200%)" },
    { name: "Invert", value: "invert(100%)" },
    { name: "Saturate", value: "saturate(200%)" },
    { name: "Hue Rotate", value: "hue-rotate(90deg)" },
    { name: "Opacity", value: "opacity(50%)" },
    { name: "Drop Shadow", value: "drop-shadow(16px 16px 20px red)" },
    { name: "Sepia + Saturate", value: "sepia(100%) saturate(200%)" },
    { name: "Contrast + Brightness", value: "contrast(150%) brightness(120%)" },
    { name: "Blur + Brightness", value: "blur(3px) brightness(120%)" },
    { name: "Invert + Contrast", value: "invert(100%) contrast(200%)" },
    {
      name: "Hue Rotate + Saturate",
      value: "hue-rotate(180deg) saturate(150%)",
    },
    { name: "Grayscale + Contrast", value: "grayscale(100%) contrast(200%)" },
    { name: "Sepia + Contrast", value: "sepia(100%) contrast(150%)" },
    { name: "Blur + Contrast", value: "blur(2px) contrast(150%)" },
    { name: "Brightness + Saturate", value: "brightness(150%) saturate(150%)" },
    { name: "Darken", value: "brightness(50%)" },
    { name: "Warm", value: "sepia(100%) brightness(110%) contrast(120%)" },
    {
      name: "Cool",
      value: "hue-rotate(180deg) saturate(150%) brightness(90%)",
    },
    {
      name: "Vintage",
      value: "sepia(70%) contrast(120%) brightness(90%) saturate(70%)",
    },
  ];

  let startX, startY, startWidth, startHeight;
  let isResizing = false;
  let isSelecting = false;
  let isDragging = false;
  let currentHandle;
  let selectionStartX, selectionStartY;
  let rotation = 0;
  let scaleX = 1;
  let scaleY = 1;
  let blur = 0;
  let contrast = 100;
  let brightness = 100;
  let saturation = 100;
  let hueRotate = 0;
  let originalImage = "";

  dropZone.addEventListener("click", () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = (e) => handleFiles(e.target.files);
    input.click();
  });

  dropZone.addEventListener("dragover", (e) => {
    e.preventDefault();
    dropZone.classList.add("dragover");
  });

  dropZone.addEventListener("dragleave", () => {
    dropZone.classList.remove("dragover");
  });

  dropZone.addEventListener("drop", (e) => {
    e.preventDefault();
    dropZone.classList.remove("dragover");
    handleFiles(e.dataTransfer.files);
  });

  function handleFiles(files) {
    const file = files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        originalImage = event.target.result;
        image.src = originalImage;
        image.style.display = "block";
        selection.style.display = "none";
        preview.style.display = "none";
        updateFilterPreviews(originalImage);
        dropZone.style.display = "none";
        container.style.display = "block";
        controlsContainer.style.display = "flex";
        filtersContainer.style.display = "block";
        filtersTitle.style.display = "block";
      };
      reader.readAsDataURL(file);
    }
  }

  image.addEventListener("mousedown", (e) => {
    if (isResizing || isDragging || !image.src) return;

    isSelecting = true;
    const rect = image.getBoundingClientRect();
    startX = e.clientX - rect.left;
    startY = e.clientY - rect.top;

    selection.style.left = `${startX}px`;
    selection.style.top = `${startY}px`;
    selection.style.width = "0px";
    selection.style.height = "0px";
    selection.style.display = "block";

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  });

  selection.addEventListener("mousedown", (e) => {
    if (isResizing || !image.src) return;

    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    const rect = selection.getBoundingClientRect();
    selectionStartX = rect.left - image.getBoundingClientRect().left;
    selectionStartY = rect.top - image.getBoundingClientRect().top;

    document.addEventListener("mousemove", onDragMove);
    document.addEventListener("mouseup", onDragUp);
    e.stopPropagation();
  });

  handles.forEach((handle) => {
    handle.addEventListener("mousedown", (e) => {
      if (!image.src) return;

      isResizing = true;
      currentHandle = handle;
      const rect = selection.getBoundingClientRect();
      startX = e.clientX;
      startY = e.clientY;
      startWidth = rect.width;
      startHeight = rect.height;
      selectionStartX = rect.left - image.getBoundingClientRect().left;
      selectionStartY = rect.top - image.getBoundingClientRect().top;

      document.addEventListener("mousemove", onResizeMove);
      document.addEventListener("mouseup", onResizeUp);
      e.stopPropagation();
    });
  });

  function onMouseMove(e) {
    if (!isSelecting) return;

    const rect = image.getBoundingClientRect();
    const currentX = e.clientX - rect.left;
    const currentY = e.clientY - rect.top;

    const width = Math.abs(currentX - startX);
    const height = Math.abs(currentY - startY);

    const left = Math.min(currentX, startX);
    const top = Math.min(currentY, startY);

    selection.style.width = `${width}px`;
    selection.style.height = `${height}px`;
    selection.style.left = `${Math.max(
      0,
      Math.min(left, rect.width - width)
    )}px`;
    selection.style.top = `${Math.max(
      0,
      Math.min(top, rect.height - height)
    )}px`;
  }

  function onMouseUp() {
    if (isSelecting) {
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
      isSelecting = false;
    }
  }

  function onDragMove(e) {
    if (!isDragging) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    const rect = image.getBoundingClientRect();
    const newLeft = Math.max(
      0,
      Math.min(selectionStartX + dx, rect.width - selection.offsetWidth)
    );
    const newTop = Math.max(
      0,
      Math.min(selectionStartY + dy, rect.height - selection.offsetHeight)
    );

    selection.style.left = `${newLeft}px`;
    selection.style.top = `${newTop}px`;
  }

  function onDragUp() {
    if (isDragging) {
      document.removeEventListener("mousemove", onDragMove);
      document.removeEventListener("mouseup", onDragUp);
      isDragging = false;
    }
  }

  function onResizeMove(e) {
    if (!isResizing) return;

    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    const rect = image.getBoundingClientRect();

    if (currentHandle.classList.contains("top-left")) {
      const newWidth = startWidth - dx;
      const newHeight = startHeight - dy;
      const newLeft = Math.min(
        selectionStartX + dx,
        selectionStartX + startWidth
      );
      const newTop = Math.min(
        selectionStartY + dy,
        selectionStartY + startHeight
      );

      if (
        newWidth >= 20 &&
        newHeight >= 20 &&
        newLeft >= 0 &&
        newTop >= 0 &&
        newLeft + newWidth <= rect.width &&
        newTop + newHeight <= rect.height
      ) {
        selection.style.width = `${newWidth}px`;
        selection.style.height = `${newHeight}px`;
        selection.style.left = `${newLeft}px`;
        selection.style.top = `${newTop}px`;
      }
    } else if (currentHandle.classList.contains("top-right")) {
      const newWidth = startWidth + dx;
      const newHeight = startHeight - dy;
      const newTop = Math.min(
        selectionStartY + dy,
        selectionStartY + startHeight
      );

      if (
        newWidth >= 20 &&
        newHeight >= 20 &&
        newTop >= 0 &&
        newTop + newHeight <= rect.height &&
        selectionStartX + newWidth <= rect.width
      ) {
        selection.style.width = `${newWidth}px`;
        selection.style.height = `${newHeight}px`;
        selection.style.top = `${newTop}px`;
      }
    } else if (currentHandle.classList.contains("bottom-left")) {
      const newWidth = startWidth - dx;
      const newHeight = startHeight + dy;
      const newLeft = Math.min(
        selectionStartX + dx,
        selectionStartX + startWidth
      );

      if (
        newWidth >= 20 &&
        newHeight >= 20 &&
        newLeft >= 0 &&
        newLeft + newWidth <= rect.width &&
        selectionStartY + newHeight <= rect.height
      ) {
        selection.style.width = `${newWidth}px`;
        selection.style.height = `${newHeight}px`;
        selection.style.left = `${newLeft}px`;
      }
    } else if (currentHandle.classList.contains("bottom-right")) {
      const newWidth = startWidth + dx;
      const newHeight = startHeight + dy;

      if (
        newWidth >= 20 &&
        newHeight >= 20 &&
        selectionStartX + newWidth <= rect.width &&
        selectionStartY + newHeight <= rect.height
      ) {
        selection.style.width = `${newWidth}px`;
        selection.style.height = `${newHeight}px`;
      }
    }
  }

  function onResizeUp() {
    if (isResizing) {
      document.removeEventListener("mousemove", onResizeMove);
      document.removeEventListener("mouseup", onResizeUp);
      isResizing = false;
    }
  }

  cropBtn.addEventListener("click", () => {
    if (!image.src) return;

    const rect = selection.getBoundingClientRect();
    const imageRect = image.getBoundingClientRect();

    const scaleX = image.naturalWidth / imageRect.width;
    const scaleY = image.naturalHeight / imageRect.height;

    const cropX = (rect.left - imageRect.left) * scaleX;
    const cropY = (rect.top - imageRect.top) * scaleY;
    const cropWidth = rect.width * scaleX;
    const cropHeight = rect.height * scaleY;

    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    canvas.width = cropWidth;
    canvas.height = cropHeight;

    ctx.drawImage(
      image,
      cropX,
      cropY,
      cropWidth,
      cropHeight,
      0,
      0,
      cropWidth,
      cropHeight
    );

    const croppedDataUrl = canvas.toDataURL("image/png");
    croppedImage.src = croppedDataUrl;
    preview.style.display = "block";
  });

  resetBtn.addEventListener("click", () => {
    dropZone.style.display = "flex";
    controlsContainer.style.display = "none";
    filtersContainer.style.display = "none";
    filtersTitle.style.display = "none";
    selection.style.display = "none";
    selection.style.width = "0px";
    selection.style.height = "0px";
    preview.style.display = "none";
    container.style.display = "none";
    image.src = ""; // Clear the image source
    filtersContainer.innerHTML = ""; // Clear the filters
    image.style.filter = "";
    image.style.transform = "";
    rotation = 0;
    scaleX = 1;
    scaleY = 1;
    blur = 0;
    contrast = 100;
    brightness = 100;
    saturation = 100;
    hueRotate = 0;
  });

  clearFilterBtn.addEventListener("click", () => {
    image.style.filter = "";
    blur = 0;
    contrast = 100;
    brightness = 100;
    saturation = 100;
    hueRotate = 0;
    updateFilter();
  });

  clearBtn.addEventListener("click", () => {
    selection.style.display = "none";
    selection.style.width = "0px";
    selection.style.height = "0px";
    preview.style.display = "none";
    image.src = ""; // Clear the image source
    filtersContainer.innerHTML = ""; // Clear the filters
    controlsContainer.style.display = "none";
    filtersContainer.style.display = "none";
    filtersTitle.style.display = "none";
    dropZone.style.display = "flex";
    container.style.display = "none";
    image.style.filter = "";
    image.style.transform = "";
    rotation = 0;
    scaleX = 1;
    scaleY = 1;
    blur = 0;
    contrast = 100;
    brightness = 100;
    saturation = 100;
    hueRotate = 0;
  });

  function updateFilterPreviews(src) {
    filtersContainer.innerHTML = "";
    filters.forEach((filter) => {
      const filterDiv = document.createElement("div");
      filterDiv.className = "filter";
      filterDiv.innerHTML = `
                <img src="${src}" alt="${filter.name}" style="filter: ${filter.value}">
            `;
      filterDiv.querySelector("img").addEventListener("click", () => {
        image.style.filter = filter.value;
      });
      filtersContainer.appendChild(filterDiv);
    });
  }

  function updateTransform() {
    image.style.transform = `rotate(${rotation}deg) scale(${scaleX}, ${scaleY})`;
  }

  function updateFilter() {
    image.style.filter = `
            blur(${blur}px)
            contrast(${contrast}%)
            brightness(${brightness}%)
            saturate(${saturation}%)
            hue-rotate(${hueRotate}deg)
        `;
  }

  flipHBtn.addEventListener("click", () => {
    scaleX *= -1;
    updateTransform();
  });

  flipVBtn.addEventListener("click", () => {
    scaleY *= -1;
    updateTransform();
  });

  rotateLeftBtn.addEventListener("click", () => {
    rotation -= 90;
    updateTransform();
  });

  rotateRightBtn.addEventListener("click", () => {
    rotation += 90;
    updateTransform();
  });

  blurRange.addEventListener("input", (e) => {
    blur = e.target.value;
    updateFilter();
  });

  contrastRange.addEventListener("input", (e) => {
    contrast = e.target.value;
    updateFilter();
  });

  brightnessRange.addEventListener("input", (e) => {
    brightness = e.target.value;
    updateFilter();
  });

  saturationRange.addEventListener("input", (e) => {
    saturation = e.target.value;
    updateFilter();
  });

  hueRotateRange.addEventListener("input", (e) => {
    hueRotate = e.target.value;
    updateFilter();
  });
});
