(() => {
  const { CATEGORIES, REGIONS, addProductAsync, updateProductAsync, fetchProductById, getProductById, getCurrentUser, showToast } = window.Hobak;

const MAX_IMAGES = 10;

function createSampleSvg(bg, accent, label, path) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 400">
    <rect width="400" height="400" fill="${bg}"/>
    <circle cx="200" cy="185" r="108" fill="#ffffff" fill-opacity="0.75"/>
    <g transform="translate(120,105)" fill="none" stroke="${accent}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round">
      ${path}
    </g>
    <text x="200" y="344" text-anchor="middle" font-family="sans-serif" font-size="18" font-weight="700" fill="#4d5159">${label}</text>
  </svg>`;
  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
}

const SAMPLE_IMAGES = [
  './assets/items/prod-1.jpg',
  './assets/items/prod-6.jpg'
];

function readFileAsOptimizedDataUrl(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('파일을 읽을 수 없습니다.'));
    reader.onload = () => {
      const result = reader.result;
      if (typeof result !== 'string') {
        reject(new Error('잘못된 이미지 형식입니다.'));
        return;
      }

      if (file.type === 'image/svg+xml') {
        resolve(result);
        return;
      }

      const img = new Image();
      img.onload = () => {
        const maxSide = 800;
        const scale = Math.min(1, maxSide / Math.max(img.width, img.height));
        if (scale === 1 && result.length < 350_000) {
          resolve(result);
          return;
        }
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          resolve(result);
          return;
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      img.onerror = () => resolve(result);
      img.src = result;
    };
    reader.readAsDataURL(file);
  });
}

/**
 * 중고거래 '호박' 글쓰기(내 물건 팔기) 페이지 렌더링
 * @param {HTMLElement} container
 * @param {Object} options
 * @param {Function} [options.onBackToList]
 * @param {Function} [options.onCreated]
 */
async function renderWritePage(container, options = {}) {
  const { onBackToList, onCreated, editProductId } = options;
  const isEditMode = Boolean(editProductId);
  const existingProduct = isEditMode
    ? (typeof fetchProductById === 'function' ? await fetchProductById(editProductId) : getProductById(editProductId))
    : null;
  const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  const defaultNickname = (existingProduct?.sellerName || currentUser?.nickname || '호박이웃').replace(/"/g, '&quot;');
  let uploadedImages = Array.isArray(existingProduct?.images) ? [...existingProduct.images] : [];
  let lastNumericPrice = existingProduct && !existingProduct.isFree ? String(existingProduct.price ?? '') : '';

  const categoryOptionsHtml = CATEGORIES.map(
    (cat) => `<option value="${cat}">${cat}</option>`
  ).join('');

  const regionOptionsHtml = REGIONS.map(
    (region, idx) =>
      `<option value="${region}"${idx === 0 ? ' selected' : ''}>${region}</option>`
  ).join('');

  container.innerHTML = `
    <section class="max-w-[680px] mx-auto sm:px-4 sm:py-6" aria-label="내 물건 팔기">
      <div class="ds-surface overflow-hidden">
        <form id="write-product-form" novalidate>
          <!-- 상단 이미지 업로드 영역 -->
          <div class="p-5 bg-[#f8f9fa] border-b border-[#eaebee]">
            <div class="flex items-center justify-between gap-3 mb-4">
              <button
                type="button"
                id="write-close-btn"
                class="w-9 h-9 rounded-full bg-white border border-[#eaebee] hover:bg-[#f2f3f6] text-[var(--ds-text)] inline-flex items-center justify-center text-base font-bold transition-colors"
                aria-label="목록으로 돌아가기"
                title="닫기"
              >✕</button>
              <span class="text-base font-extrabold text-[var(--ds-text)]">${isEditMode ? '내 물건 수정하기' : '내 물건 팔기'}</span>
              <button
                type="button"
                id="write-sample-toggle-btn"
                class="px-3 py-1.5 rounded-full bg-[var(--ds-primary)] hover:bg-[var(--ds-primary-hover)] text-white text-xs font-bold transition-colors"
              >샘플 이미지 채우기</button>
            </div>

            <input
              type="file"
              id="write-image-input"
              class="sr-only"
              accept="image/*"
              multiple
              aria-label="상품 이미지 선택"
            />

            <div class="flex items-center gap-3 overflow-x-auto pb-1 no-scrollbar">
              <button
                type="button"
                id="write-image-add-btn"
                class="w-20 h-20 rounded-xl border border-dashed border-[#dcdee3] bg-white hover:border-[var(--ds-primary)] hover:bg-[var(--ds-secondary)]/40 flex flex-col items-center justify-center gap-1 shrink-0 transition-colors disabled:opacity-40"
                aria-label="사진 추가하기"
              >
                <span class="text-2xl leading-none text-[#868b94]" aria-hidden="true">+</span>
                <span id="write-image-count" class="text-xs font-semibold text-[#868b94]">0/${MAX_IMAGES}</span>
              </button>
              <ul
                id="write-thumbnail-list"
                class="flex items-center gap-3 list-none"
                aria-label="업로드된 상품 사진 목록"
              ></ul>
            </div>
            <p class="mt-2.5 text-xs text-[#868b94]">
              첫 번째 사진이 대표 이미지로 등록됩니다. (최대 ${MAX_IMAGES}장)
            </p>
          </div>

          <!-- 판매자 & 동네 영역 -->
          <div class="px-5 py-4 border-b border-[#eaebee]">
            <div class="flex items-center gap-3.5">
              <div class="w-11 h-11 rounded-full bg-[#eaebee] text-[#868b94] flex items-center justify-center shrink-0" aria-hidden="true">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                  <circle cx="12" cy="7" r="4"></circle>
                </svg>
              </div>
              <div class="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div class="flex flex-col gap-1">
                  <label for="write-seller-name" class="text-xs font-semibold text-[#868b94]">판매자 닉네임</label>
                  <input
                    type="text"
                    id="write-seller-name"
                    class="h-9 px-3 rounded-lg border border-[#dcdee3] text-sm text-[var(--ds-text)] focus:outline-none focus:border-[var(--ds-text)]"
                    value="${defaultNickname}"
                    maxlength="20"
                    placeholder="닉네임"
                  />
                </div>
                <div class="flex flex-col gap-1">
                  <label for="write-region" class="text-xs font-semibold text-[#868b94]">거래 희망 동네</label>
                  <select id="write-region" class="h-9 px-3 rounded-lg border border-[#dcdee3] bg-white text-sm text-[var(--ds-text)] focus:outline-none focus:border-[var(--ds-text)]">
                    ${regionOptionsHtml}
                  </select>
                </div>
              </div>
            </div>
          </div>

          <!-- 상품 정보 입력 영역 (제목 / 카테고리 / 가격 / 설명) -->
          <div class="p-5 space-y-5">
            <div id="field-title">
              <label for="write-title" class="block text-sm font-bold text-[var(--ds-text)] mb-1.5">
                제목 <span class="text-[var(--ds-primary)]" aria-hidden="true">*</span>
              </label>
              <input
                type="text"
                id="write-title"
                class="w-full h-11 px-3.5 rounded-lg border border-[#dcdee3] text-[0.95rem] text-[var(--ds-text)] placeholder:text-[#868b94] focus:outline-none focus:border-[var(--ds-text)] aria-[invalid=true]:border-red-500"
                placeholder="글 제목을 입력해주세요"
                maxlength="80"
                required
                aria-required="true"
                aria-describedby="error-title"
              />
              <p id="error-title" class="mt-1 text-xs font-medium text-red-600 min-h-[1rem]" role="alert"></p>
            </div>

            <div id="field-category">
              <label for="write-category" class="block text-sm font-bold text-[var(--ds-text)] mb-1.5">
                카테고리 <span class="text-[var(--ds-primary)]" aria-hidden="true">*</span>
              </label>
              <select
                id="write-category"
                class="w-full h-11 px-3.5 rounded-lg border border-[#dcdee3] bg-white text-[0.95rem] text-[var(--ds-text)] focus:outline-none focus:border-[var(--ds-text)] aria-[invalid=true]:border-red-500"
                required
                aria-required="true"
                aria-describedby="error-category"
              >
                <option value="">카테고리를 선택해주세요</option>
                ${categoryOptionsHtml}
              </select>
              <p id="error-category" class="mt-1 text-xs font-medium text-red-600 min-h-[1rem]" role="alert"></p>
            </div>

            <div id="field-price">
              <label for="write-price" class="block text-sm font-bold text-[var(--ds-text)] mb-1.5">가격</label>
              <div class="flex flex-col sm:flex-row sm:items-center gap-3">
                <div class="relative flex-1">
                  <input
                    type="number"
                    id="write-price"
                    class="w-full h-11 pl-3.5 pr-9 rounded-lg border border-[#dcdee3] text-[0.95rem] text-[var(--ds-text)] placeholder:text-[#868b94] focus:outline-none focus:border-[var(--ds-text)] disabled:bg-[#f2f3f6] disabled:text-[#868b94] aria-[invalid=true]:border-red-500"
                    placeholder="가격을 입력해주세요"
                    min="0"
                    step="100"
                    inputmode="numeric"
                    aria-describedby="error-price"
                  />
                  <span class="absolute right-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#4d5159]">원</span>
                </div>
                <div class="flex items-center gap-4 shrink-0">
                  <label class="inline-flex items-center gap-1.5 text-sm text-[var(--ds-text)] cursor-pointer">
                    <input type="checkbox" id="write-is-free" class="w-4 h-4 accent-[var(--ds-primary)]" />
                    <span>나눔</span>
                  </label>
                  <label class="inline-flex items-center gap-1.5 text-sm text-[var(--ds-text)] cursor-pointer">
                    <input type="checkbox" id="write-is-negotiable" class="w-4 h-4 accent-[var(--ds-primary)]" checked />
                    <span>가격 제안 받기</span>
                  </label>
                </div>
              </div>
              <p id="error-price" class="mt-1 text-xs font-medium text-red-600 min-h-[1rem]" role="alert"></p>
            </div>

            <div id="field-description">
              <label for="write-description" class="block text-sm font-bold text-[var(--ds-text)] mb-1.5">
                자세한 설명 <span class="text-[var(--ds-primary)]" aria-hidden="true">*</span>
              </label>
              <textarea
                id="write-description"
                class="w-full min-h-[160px] p-3.5 rounded-lg border border-[#dcdee3] text-[0.95rem] text-[var(--ds-text)] placeholder:text-[#868b94] leading-relaxed focus:outline-none focus:border-[var(--ds-text)] aria-[invalid=true]:border-red-500 resize-y"
                placeholder="브랜드, 사이즈, 구매 시기, 사용감(상태), 희망 거래 장소 등 물품에 대한 자세한 정보를 작성해주세요.&#10;신뢰할 수 있는 거래를 위해 자세히 적어주시면 좋아요."
                maxlength="2000"
                required
                aria-required="true"
                aria-describedby="error-description"
              ></textarea>
              <div class="flex items-center justify-between mt-1">
                <p id="error-description" class="text-xs font-medium text-red-600" role="alert"></p>
                <span id="write-desc-count" class="text-xs text-[#868b94]">0 / 2000</span>
              </div>
            </div>
          </div>

          <!-- 하단 액션 바 -->
          <div class="flex items-center justify-end gap-2.5 px-5 py-4 border-t border-[#eaebee] bg-[#f8f9fa]">
            <button
              type="button"
              id="write-cancel-btn"
              class="px-5 py-2.5 rounded-lg border border-[#dcdee3] bg-white hover:bg-[#f2f3f6] text-sm font-semibold text-[var(--ds-text)] transition-colors"
            >취소</button>
            <button
              type="submit"
              id="write-submit-btn"
              class="ds-btn-primary px-6 py-2.5 text-sm font-bold transition-colors"
            >${isEditMode ? '수정 완료' : '작성 완료'}</button>
          </div>
        </form>
      </div>
    </section>
  `;

  // DOM 참조
  const form = container.querySelector('#write-product-form');
  const closeBtn = container.querySelector('#write-close-btn');
  const cancelBtn = container.querySelector('#write-cancel-btn');
  const sampleToggleBtn = container.querySelector('#write-sample-toggle-btn');
  const imageInput = container.querySelector('#write-image-input');
  const imageAddBtn = container.querySelector('#write-image-add-btn');
  const imageCountEl = container.querySelector('#write-image-count');
  const thumbnailListEl = container.querySelector('#write-thumbnail-list');

  const sellerNameInput = container.querySelector('#write-seller-name');
  const regionSelect = container.querySelector('#write-region');
  const titleInput = container.querySelector('#write-title');
  const categorySelect = container.querySelector('#write-category');
  const priceInput = container.querySelector('#write-price');
  const isFreeCheckbox = container.querySelector('#write-is-free');
  const isNegotiableCheckbox = container.querySelector('#write-is-negotiable');
  const descriptionInput = container.querySelector('#write-description');
  const descCountEl = container.querySelector('#write-desc-count');

  const fieldMap = {
    title: {
      wrapper: container.querySelector('#field-title'),
      input: titleInput,
      error: container.querySelector('#error-title')
    },
    category: {
      wrapper: container.querySelector('#field-category'),
      input: categorySelect,
      error: container.querySelector('#error-category')
    },
    price: {
      wrapper: container.querySelector('#field-price'),
      input: priceInput,
      error: container.querySelector('#error-price')
    },
    description: {
      wrapper: container.querySelector('#field-description'),
      input: descriptionInput,
      error: container.querySelector('#error-description')
    }
  };

  function setFieldError(key, message) {
    const field = fieldMap[key];
    if (!field) return;
    if (message) {
      field.wrapper.classList.add('has-error');
      field.input.setAttribute('aria-invalid', 'true');
      field.error.textContent = message;
    } else {
      field.wrapper.classList.remove('has-error');
      field.input.removeAttribute('aria-invalid');
      field.error.textContent = '';
    }
  }

  function renderThumbnails() {
    imageCountEl.textContent = `${uploadedImages.length}/${MAX_IMAGES}`;
    imageAddBtn.disabled = uploadedImages.length >= MAX_IMAGES;
    sampleToggleBtn.textContent =
      uploadedImages.length > 0 ? '사진 초기화' : '샘플 이미지 채우기';

    thumbnailListEl.innerHTML = uploadedImages
      .map(
        (src, index) => `
          <li class="relative w-20 h-20 rounded-xl overflow-hidden border border-[#eaebee] bg-white shrink-0">
            <img class="w-full h-full object-cover" src="${src}" alt="업로드된 상품 사진 ${index + 1}" />
            ${index === 0 ? '<span class="absolute bottom-0 inset-x-0 bg-black/65 text-white text-[0.65rem] font-bold text-center py-0.5">대표 사진</span>' : ''}
            <button
              type="button"
              class="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/65 hover:bg-black text-white text-[0.65rem] inline-flex items-center justify-center"
              data-remove-index="${index}"
              aria-label="${index + 1}번째 사진 삭제"
              title="사진 삭제"
            >✕</button>
          </li>
        `
      )
      .join('');
  }

  // 닫기 / 취소
  const handleBack = () => {
    if (typeof onBackToList === 'function') {
      onBackToList();
    }
  };
  closeBtn.addEventListener('click', handleBack);
  cancelBtn.addEventListener('click', handleBack);

  // 샘플 이미지 채우기 / 사진 초기화 토글
  sampleToggleBtn.addEventListener('click', () => {
    if (uploadedImages.length > 0) {
      uploadedImages = [];
      renderThumbnails();
      showToast('사진이 초기화되었습니다.');
    } else {
      uploadedImages = [...SAMPLE_IMAGES];
      renderThumbnails();
      showToast('샘플 이미지가 추가되었습니다.');
    }
  });

  // 사진 추가 버튼
  imageAddBtn.addEventListener('click', () => {
    if (uploadedImages.length >= MAX_IMAGES) {
      showToast(`사진은 최대 ${MAX_IMAGES}장까지 등록할 수 있어요.`);
      return;
    }
    imageInput.click();
  });

  // 로컬 이미지 파일 선택 처리
  imageInput.addEventListener('change', async (e) => {
    const files = Array.from(e.target.files || []).filter((f) =>
      f.type.startsWith('image/')
    );
    imageInput.value = '';
    if (files.length === 0) return;

    const remaining = MAX_IMAGES - uploadedImages.length;
    const targetFiles = files.slice(0, remaining);
    if (files.length > remaining) {
      showToast(`최대 ${MAX_IMAGES}장까지만 등록 가능하여 일부만 추가됩니다.`);
    }

    try {
      const dataUrls = await Promise.all(targetFiles.map(readFileAsOptimizedDataUrl));
      uploadedImages = [...uploadedImages, ...dataUrls];
      renderThumbnails();
    } catch {
      showToast('이미지를 불러오는 중 문제가 발생했습니다.');
    }
  });

  // 개별 썸네일 삭제
  thumbnailListEl.addEventListener('click', (e) => {
    const removeBtn = e.target.closest('[data-remove-index]');
    if (!removeBtn) return;
    const idx = Number(removeBtn.dataset.removeIndex);
    if (Number.isNaN(idx)) return;
    uploadedImages = uploadedImages.filter((_, i) => i !== idx);
    renderThumbnails();
  });

  // 나눔 체크박스 연동
  isFreeCheckbox.addEventListener('change', () => {
    if (isFreeCheckbox.checked) {
      lastNumericPrice = priceInput.value;
      priceInput.value = '0';
      priceInput.disabled = true;
      setFieldError('price', '');
    } else {
      priceInput.disabled = false;
      priceInput.value = lastNumericPrice === '0' ? '' : lastNumericPrice;
      priceInput.focus();
    }
  });

  // 입력 시 에러 해제 및 글자 수 업데이트
  titleInput.addEventListener('input', () => {
    if (titleInput.value.trim()) setFieldError('title', '');
  });

  categorySelect.addEventListener('change', () => {
    if (categorySelect.value) setFieldError('category', '');
  });

  priceInput.addEventListener('input', () => {
    if (Number(priceInput.value) < 0) {
      priceInput.value = '0';
    }
    setFieldError('price', '');
  });

  descriptionInput.addEventListener('input', () => {
    descCountEl.textContent = `${descriptionInput.value.length} / 2000`;
    if (descriptionInput.value.trim()) setFieldError('description', '');
  });

  // 폼 제출 및 유효성 검사
  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const title = titleInput.value.trim();
    const category = categorySelect.value;
    const isFree = isFreeCheckbox.checked;
    const rawPrice = priceInput.value.trim();
    const numericPrice = isFree ? 0 : Number(rawPrice);
    const description = descriptionInput.value.trim();

    let firstInvalidInput = null;

    if (!title) {
      setFieldError('title', '글 제목을 입력해주세요.');
      firstInvalidInput = firstInvalidInput || titleInput;
    } else {
      setFieldError('title', '');
    }

    if (!category) {
      setFieldError('category', '카테고리를 선택해주세요.');
      firstInvalidInput = firstInvalidInput || categorySelect;
    } else {
      setFieldError('category', '');
    }

    if (!isFree && (rawPrice === '' || Number.isNaN(numericPrice) || numericPrice < 0)) {
      setFieldError('price', '판매 가격을 입력하거나 나눔을 선택해주세요.');
      firstInvalidInput = firstInvalidInput || priceInput;
    } else {
      setFieldError('price', '');
    }

    if (!description) {
      setFieldError('description', '상품에 대한 자세한 설명을 입력해주세요.');
      firstInvalidInput = firstInvalidInput || descriptionInput;
    } else {
      setFieldError('description', '');
    }

    if (firstInvalidInput) {
      firstInvalidInput.focus();
      return;
    }

    const submitBtn = container.querySelector('#write-submit-btn');
    if (submitBtn) {
      submitBtn.disabled = true;
      submitBtn.textContent = '등록 중...';
    }

    try {
      const payload = {
        title,
        category,
        price: numericPrice,
        isFree,
        isNegotiable: isNegotiableCheckbox.checked,
        description,
        region: regionSelect.value,
        sellerName: sellerNameInput.value.trim() || '호박이웃',
        images: uploadedImages
      };

      const savedProduct = isEditMode
        ? await updateProductAsync(editProductId, payload)
        : await addProductAsync(payload);

      showToast(isEditMode ? '게시글이 수정되었습니다!' : '상품이 등록되었습니다!');
      if (typeof onCreated === 'function') {
        onCreated(savedProduct?.id || editProductId);
      }
    } finally {
      if (submitBtn) {
        submitBtn.disabled = false;
        submitBtn.textContent = isEditMode ? '수정 완료' : '작성 완료';
      }
    }
  });

  if (existingProduct) {
    titleInput.value = existingProduct.title || '';
    categorySelect.value = existingProduct.category || '';
    regionSelect.value = existingProduct.primaryRegion || REGIONS[0];
    isFreeCheckbox.checked = Boolean(existingProduct.isFree);
    isNegotiableCheckbox.checked = Boolean(existingProduct.isNegotiable);
    if (existingProduct.isFree) {
      priceInput.value = '0';
      priceInput.disabled = true;
    } else {
      priceInput.value = String(existingProduct.price ?? '');
    }
    descriptionInput.value = existingProduct.description || '';
    descCountEl.textContent = `${descriptionInput.value.length} / 2000`;
  }

  renderThumbnails();
}

  window.Hobak = Object.assign(window.Hobak || {}, { renderWritePage });
})();
