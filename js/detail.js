/**
 * 호박(Hobak) 상품 상세 페이지 모듈
 */
(() => {
  const {
    getProductById,
    fetchProductById,
    getLikedIds,
    fetchLikedIdsAsync,
    toggleLikeAsync,
    getCurrentUser,
    getStatusLabel,
    updateProductStatusAsync,
    deleteProductAsync,
    formatPrice,
    formatTimeAgo,
    showToast
  } = window.Hobak;

function getMannerMeta(temp = 36.5) {
  const value = Number(temp) || 36.5;
  if (value >= 55) {
    return { emoji: '😍', color: 'var(--manner-high)', percent: Math.min(100, value) };
  }
  if (value >= 42) {
    return { emoji: '😊', color: '#ff8a3d', percent: value };
  }
  if (value >= 36.5) {
    return { emoji: '🙂', color: '#2b9e5b', percent: value };
  }
  return { emoji: '😐', color: 'var(--text-tertiary)', percent: Math.max(10, value) };
}

function createHeartSvg(filled) {
  return `
    <svg width="22" height="22" viewBox="0 0 24 24" fill="${filled ? 'currentColor' : 'none'}"
      stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
    </svg>
  `;
}

function setupCarousel(carouselEl, totalSlides) {
  const track = carouselEl.querySelector('.detail-carousel-track');
  const slides = Array.from(carouselEl.querySelectorAll('.detail-carousel-slide'));
  const prevBtn = carouselEl.querySelector('[data-direction="previous"]');
  const nextBtn = carouselEl.querySelector('[data-direction="next"]');
  const dotsNav = carouselEl.querySelector('.detail-carousel-dots');
  const counterEl = carouselEl.querySelector('.detail-carousel-counter');
  const statusEl = carouselEl.querySelector('[role="status"]');

  if (!track || slides.length === 0 || totalSlides <= 1) return;

  const dots = dotsNav ? Array.from(dotsNav.querySelectorAll('.detail-carousel-dot')) : [];
  let activeIndex = 0;
  let settledIndex = 0;
  let pendingIndex = null;
  let rafId = null;
  let fallbackTimer = null;

  const getNearestIndex = () => {
    const trackCenter = track.scrollLeft + track.clientWidth / 2;
    let bestIdx = 0;
    let bestDist = Infinity;
    slides.forEach((slide, idx) => {
      const slideCenter = slide.offsetLeft + slide.offsetWidth / 2;
      const dist = Math.abs(slideCenter - trackCenter);
      if (dist < bestDist) {
        bestDist = dist;
        bestIdx = idx;
      }
    });
    return bestIdx;
  };

  const syncMarkers = (idx) => {
    if (idx === activeIndex && dots[idx]?.getAttribute('aria-current') === 'true') return;
    activeIndex = idx;
    dots.forEach((dot, i) => {
      dot.setAttribute('aria-current', i === idx ? 'true' : 'false');
    });
    if (counterEl) {
      counterEl.textContent = `${idx + 1} / ${totalSlides}`;
    }
  };

  const syncButtons = (idx) => {
    if (prevBtn) prevBtn.disabled = idx <= 0;
    if (nextBtn) nextBtn.disabled = idx >= totalSlides - 1;
  };

  const scrollToIndex = (targetIdx) => {
    const clamped = Math.max(0, Math.min(totalSlides - 1, targetIdx));
    const targetSlide = slides[clamped];
    if (!targetSlide) return;
    pendingIndex = clamped;
    syncMarkers(clamped);
    syncButtons(clamped);
    const left = targetSlide.offsetLeft - (track.clientWidth - targetSlide.offsetWidth) / 2;
    track.scrollTo({ left });
  };

  const handleSettle = () => {
    const current = getNearestIndex();
    if (pendingIndex !== null && current !== pendingIndex) {
      // 이전 스크롤의 scrollend가 새 스크롤 도중 도착한 경우 무시
      return;
    }
    pendingIndex = null;
    syncMarkers(current);
    syncButtons(current);
    if (current !== settledIndex) {
      settledIndex = current;
      if (statusEl) {
        statusEl.textContent = `${totalSlides}개 이미지 중 ${current + 1}번째 이미지`;
      }
    }
  };

  prevBtn?.addEventListener('click', () => {
    const base = pendingIndex !== null ? pendingIndex : getNearestIndex();
    scrollToIndex(base - 1);
  });

  nextBtn?.addEventListener('click', () => {
    const base = pendingIndex !== null ? pendingIndex : getNearestIndex();
    scrollToIndex(base + 1);
  });

  dots.forEach((dot, idx) => {
    dot.addEventListener('click', () => {
      scrollToIndex(idx);
    });
  });

  const supportsScrollEnd = 'onscrollend' in window;
  track.addEventListener(
    'scroll',
    () => {
      if (pendingIndex === null && rafId === null) {
        rafId = requestAnimationFrame(() => {
          rafId = null;
          syncMarkers(getNearestIndex());
        });
      }
      if (!supportsScrollEnd) {
        clearTimeout(fallbackTimer);
        fallbackTimer = setTimeout(handleSettle, 120);
      }
    },
    { passive: true }
  );

  if (supportsScrollEnd) {
    track.addEventListener('scrollend', handleSettle);
  }

  // 초기 상태 동기화 (스크린리더 status는 비워둠)
  syncMarkers(0);
  syncButtons(0);
}

/**
 * 상품 상세 페이지 렌더링
 * @param {HTMLElement} container
 * @param {string} productId
 * @param {{ onBackToList?: () => void, onNavigateWrite?: () => void }} options
 */
async function renderDetailPage(container, productId, options = {}) {
  if (!container) return;

  const { onBackToList, onNavigateWrite, onEditProduct } = options;
  const [remoteProduct, remoteLikedIds] = await Promise.all([
    typeof fetchProductById === 'function' ? fetchProductById(productId) : getProductById(productId),
    typeof fetchLikedIdsAsync === 'function' ? fetchLikedIdsAsync() : getLikedIds()
  ]);
  const product = remoteProduct || getProductById(productId);
  const currentUser = typeof getCurrentUser === 'function' ? getCurrentUser() : null;
  const isOwner = Boolean(currentUser && product?.sellerId && currentUser.id === product.sellerId);
  let currentStatus = product?.status || 'on_sale';

  if (!product) {
    container.innerHTML = `
      <div class="max-w-[680px] mx-auto px-4 py-12">
        <div class="text-center py-14 px-6 border border-[#eaebee] rounded-2xl bg-[#f8f9fa]">
          <p class="text-[#4d5159] mb-4">요청하신 상품 정보를 찾을 수 없습니다.</p>
          <button type="button" class="px-4 py-2 rounded-md bg-[var(--ds-primary)] hover:bg-[var(--ds-primary-hover)] text-white text-sm font-bold" data-action="back-to-list">목록으로 돌아가기</button>
        </div>
      </div>
    `;
    container.querySelector('[data-action="back-to-list"]')?.addEventListener('click', () => {
      onBackToList?.();
    });
    return;
  }

  const images = Array.isArray(product.images) ? product.images : [];
  const totalSlides = images.length;
  const likedIds = Array.isArray(remoteLikedIds) ? remoteLikedIds : getLikedIds();
  let isLiked = likedIds.includes(product.id);
  let likesCount = Number(product.likes) || 0;

  const manner = getMannerMeta(product.sellerMannerTemp);
  const priceText = formatPrice(product.price, product.isFree);
  const timeText = formatTimeAgo(product.createdAt);

  const pageEl = document.createElement('div');
  pageEl.className = 'max-w-[680px] mx-auto sm:px-4 sm:py-6';

  pageEl.innerHTML = `
    <article class="ds-surface overflow-hidden">
      <section class="detail-carousel relative bg-[#f2f3f6]" aria-roledescription="carousel" aria-label="상품 이미지">
        <div class="absolute top-3.5 inset-x-3.5 z-20 flex items-center justify-between pointer-events-none">
          <button type="button" class="pointer-events-auto w-9 h-9 rounded-full bg-black/45 hover:bg-black/65 text-white inline-flex items-center justify-center backdrop-blur-sm transition-colors" data-action="back-to-list" aria-label="목록으로 돌아가기">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </button>
          <button type="button" class="pointer-events-auto px-3.5 py-1.5 rounded-full bg-[var(--ds-primary)] hover:bg-[var(--ds-primary-hover)] text-white text-xs font-bold shadow-sm transition-colors" data-action="top-list">
            목록으로
          </button>
        </div>

        ${
          totalSlides > 1
            ? `
          <div class="pointer-events-none absolute inset-y-0 inset-x-2.5 z-10 flex items-center justify-between">
            <button type="button" class="detail-carousel-arrow pointer-events-auto w-8 h-8 rounded-full bg-black/40 hover:bg-black/65 text-white inline-flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none transition-opacity" data-direction="previous" aria-label="이전 이미지">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="15 18 9 12 15 6"></polyline>
              </svg>
            </button>
            <button type="button" class="detail-carousel-arrow pointer-events-auto w-8 h-8 rounded-full bg-black/40 hover:bg-black/65 text-white inline-flex items-center justify-center disabled:opacity-30 disabled:pointer-events-none transition-opacity" data-direction="next" aria-label="다음 이미지">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <polyline points="9 18 15 12 9 6"></polyline>
              </svg>
            </button>
          </div>
        `
            : ''
        }

        <div class="detail-carousel-track flex overflow-x-auto snap-x snap-mandatory scroll-smooth no-scrollbar aspect-square sm:aspect-[4/3]" tabindex="0" role="group" aria-label="상품 이미지 목록">
          ${images
            .map(
              (src, idx) => `
            <div class="detail-carousel-slide w-full h-full shrink-0 snap-center" role="group" aria-roledescription="slide" aria-label="${totalSlides}개 중 ${idx + 1}번째 이미지">
              <img class="w-full h-full object-cover" src="${src}" alt="" />
            </div>
          `
            )
            .join('')}
        </div>

        <p class="sr-only" role="status" aria-live="polite"></p>

        ${
          totalSlides > 1
            ? `
          <nav class="detail-carousel-dots absolute bottom-3.5 left-1/2 -translate-x-1/2 z-10 flex items-center gap-1.5" aria-label="이미지 슬라이드 선택">
            ${images
              .map(
                (_, idx) => `
              <button type="button" class="detail-carousel-dot w-2 h-2 rounded-full bg-white/50 aria-[current=true]:bg-white aria-[current=true]:scale-125 transition-all" aria-label="${idx + 1}번째 이미지 보기" aria-current="${idx === 0 ? 'true' : 'false'}"></button>
            `
              )
              .join('')}
          </nav>
          <span class="detail-carousel-counter absolute bottom-3 right-3.5 z-10 px-2.5 py-0.5 rounded-full bg-black/50 text-white text-xs font-semibold" aria-hidden="true">1 / ${totalSlides}</span>
        `
            : ''
        }
      </section>

      <section class="flex items-center justify-between gap-4 px-5 py-4 border-b border-[#eaebee]" aria-label="판매자 정보">
        <div class="flex items-center gap-3 min-w-0">
          <div class="w-11 h-11 rounded-full bg-[#eaebee] text-[#868b94] flex items-center justify-center shrink-0" aria-hidden="true">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
          </div>
          <div class="min-w-0">
            <p class="detail-seller-name text-[0.95rem] font-bold text-[var(--ds-text)] truncate"></p>
            <p class="detail-seller-region text-xs text-[#868b94] truncate"></p>
          </div>
        </div>

        <div class="text-right shrink-0">
          <div class="inline-flex items-center gap-1 text-[0.95rem] font-extrabold" style="color: ${manner.color}">
            <span class="detail-manner-temp"></span>
            <span aria-hidden="true">${manner.emoji}</span>
          </div>
          <div class="w-16 h-1.5 rounded-full bg-[#eaebee] overflow-hidden ml-auto my-1" aria-hidden="true">
            <div class="h-full rounded-full" style="width: ${manner.percent}%; background-color: ${manner.color};"></div>
          </div>
          <button type="button" class="text-xs text-[#868b94] underline hover:text-[#4d5159]" data-action="manner-info">매너온도</button>
        </div>
      </section>

      <section class="px-5 py-6">
        <div class="mb-2 flex items-center gap-2">
          <span class="detail-status-badge px-2.5 py-0.5 rounded-md text-xs font-bold"></span>
        </div>
        <h1 class="detail-title text-xl sm:text-[1.35rem] font-bold text-[var(--ds-text)] leading-snug"></h1>
        <p class="detail-category-time text-xs text-[#868b94] mt-1.5"></p>
        <div class="flex items-center gap-2 flex-wrap mt-3">
          <span class="detail-price text-xl font-extrabold ${product.isFree ? 'text-[var(--ds-primary)]' : 'text-[var(--ds-text)]'}"></span>
          ${product.isNegotiable ? '<span class="px-2 py-0.5 rounded bg-[#f2f3f6] text-[#4d5159] text-xs font-semibold">가격 제안 가능</span>' : ''}
          ${product.payEnabled ? '<span class="px-2 py-0.5 rounded bg-[var(--ds-secondary)] text-[var(--ds-primary)] text-xs font-bold">호박페이</span>' : ''}
        </div>
        <p class="detail-description mt-5 text-[0.95rem] text-[var(--ds-text)] leading-relaxed whitespace-pre-line"></p>
        <p class="detail-stats mt-6 text-xs text-[#868b94]"></p>
      </section>

      <div class="flex items-center justify-between gap-3 px-5 py-3.5 border-t border-[#eaebee] bg-white">
        <div class="flex items-center gap-3 min-w-0">
          <button type="button" class="p-2 rounded-lg text-[#868b94] hover:bg-[#f2f3f6] aria-[pressed=true]:text-[var(--ds-primary)] transition-colors" data-action="toggle-like" aria-pressed="${isLiked ? 'true' : 'false'}" aria-label="관심 상품 ${isLiked ? '해제' : '등록'}">
            ${createHeartSvg(isLiked)}
          </button>
          <span class="w-px h-7 bg-[#eaebee]" aria-hidden="true"></span>
          <div class="flex flex-col min-w-0">
            <span class="detail-action-price text-base font-extrabold text-[var(--ds-text)] truncate"></span>
            <span class="text-xs text-[#868b94]">${product.isNegotiable ? '가격 제안 가능' : '가격 제안 불가'}</span>
          </div>
        </div>
        <button type="button" class="ds-btn-primary px-5 py-2.5 text-sm font-bold shrink-0 transition-colors" data-action="start-chat">채팅하기</button>
      </div>

      ${
        isOwner
          ? `
        <section class="px-5 py-4 border-t border-[#eaebee] bg-[#f8f9fa]" aria-label="내 게시글 관리">
          <div class="flex items-center justify-between gap-3 flex-wrap">
            <div class="flex items-center gap-1.5 flex-wrap" role="group" aria-label="판매 상태 변경">
              <span class="text-xs font-bold text-[#4d5159] mr-1">상태</span>
              <button type="button" class="detail-status-btn px-3 py-1.5 rounded-full border text-xs font-bold transition-colors" data-status="on_sale">판매중</button>
              <button type="button" class="detail-status-btn px-3 py-1.5 rounded-full border text-xs font-bold transition-colors" data-status="reserved">예약중</button>
              <button type="button" class="detail-status-btn px-3 py-1.5 rounded-full border text-xs font-bold transition-colors" data-status="sold">거래완료</button>
            </div>
            <div class="flex items-center gap-2">
              <button type="button" class="px-3.5 py-1.5 rounded-md border border-[#dcdee3] bg-white hover:bg-[#f2f3f6] text-xs font-bold text-[var(--ds-text)]" data-action="edit-product">수정</button>
              <button type="button" class="px-3.5 py-1.5 rounded-md border border-red-200 bg-red-50 hover:bg-red-100 text-xs font-bold text-red-600" data-action="delete-product">삭제</button>
            </div>
          </div>
        </section>
      `
          : ''
      }
    </article>

    <div class="flex items-center justify-between gap-3 px-4 sm:px-0 mt-5">
      <button type="button" class="px-4 py-2 rounded-md border border-[#dcdee3] bg-white hover:bg-[#f8f9fa] text-sm font-semibold text-[var(--ds-text)]" data-action="back-to-list-bottom">← 목록으로 돌아가기</button>
      <button type="button" class="px-4 py-2 rounded-md bg-[var(--ds-primary)] hover:bg-[var(--ds-primary-hover)] text-white text-sm font-bold" data-action="go-write">+ 내 물건 팔기</button>
    </div>
  `;

  // 안전한 텍스트 바인딩
  pageEl.querySelectorAll('.detail-carousel-slide img').forEach((img, idx) => {
    img.alt = `${product.title} 이미지 ${idx + 1}`;
  });
  pageEl.querySelector('.detail-seller-name').textContent = product.sellerName || '호박이웃';
  pageEl.querySelector('.detail-seller-region').textContent = product.region || '한남동';
  pageEl.querySelector('.detail-manner-temp').textContent = `${Number(product.sellerMannerTemp || 36.5).toFixed(1).replace(/\.0$/, '')}°C`;
  pageEl.querySelector('.detail-title').textContent = product.title;
  pageEl.querySelector('.detail-category-time').textContent = `${product.category} · ${timeText}`;
  pageEl.querySelector('.detail-price').textContent = priceText;
  pageEl.querySelector('.detail-description').textContent = product.description;
  pageEl.querySelector('.detail-action-price').textContent = priceText;

  const statsEl = pageEl.querySelector('.detail-stats');
  const updateStatsText = () => {
    statsEl.textContent = `관심 ${likesCount} · 채팅 ${product.chats ?? 0} · 조회 ${product.views ?? 0}`;
  };
  updateStatsText();

  const statusBadgeEl = pageEl.querySelector('.detail-status-badge');
  const statusBtns = pageEl.querySelectorAll('.detail-status-btn');
  const syncStatusUI = (status) => {
    currentStatus = status;
    const label = typeof getStatusLabel === 'function' ? getStatusLabel(status) : '판매중';
    if (statusBadgeEl) {
      statusBadgeEl.textContent = label;
      statusBadgeEl.className =
        status === 'sold'
          ? 'detail-status-badge px-2.5 py-0.5 rounded-md text-xs font-bold bg-[#4d5159] text-white'
          : status === 'reserved'
            ? 'detail-status-badge px-2.5 py-0.5 rounded-md text-xs font-bold bg-emerald-600 text-white'
            : 'detail-status-badge px-2.5 py-0.5 rounded-md text-xs font-bold bg-[var(--ds-secondary)] text-[var(--ds-primary)]';
    }
    statusBtns.forEach((btn) => {
      const isSelected = btn.getAttribute('data-status') === status;
      btn.setAttribute('aria-pressed', String(isSelected));
      btn.className = isSelected
        ? 'detail-status-btn px-3 py-1.5 rounded-full border text-xs font-bold bg-[var(--ds-primary)] text-[var(--ds-on-primary)] border-[var(--ds-primary)] transition-colors'
        : 'detail-status-btn px-3 py-1.5 rounded-full border text-xs font-bold bg-white text-[#4d5159] border-[#dcdee3] hover:bg-[#f2f3f6] transition-colors';
    });
  };
  syncStatusUI(currentStatus);

  statusBtns.forEach((btn) => {
    btn.addEventListener('click', async () => {
      const nextStatus = btn.getAttribute('data-status');
      if (!nextStatus || nextStatus === currentStatus) return;
      btn.disabled = true;
      await updateProductStatusAsync(product.id, nextStatus);
      btn.disabled = false;
      syncStatusUI(nextStatus);
      showToast(`거래 상태가 '${getStatusLabel(nextStatus)}'(으)로 변경되었습니다.`);
    });
  });

  pageEl.querySelector('[data-action="edit-product"]')?.addEventListener('click', () => {
    onEditProduct?.(product.id);
  });

  pageEl.querySelector('[data-action="delete-product"]')?.addEventListener('click', async (e) => {
    if (!window.confirm('정말 이 게시글을 삭제하시겠습니까?')) return;
    const btn = e.currentTarget;
    btn.disabled = true;
    await deleteProductAsync(product.id);
    showToast('게시글이 삭제되었습니다.');
    goBack();
  });

  // 캐러셀 초기화
  const carouselEl = pageEl.querySelector('.detail-carousel');
  setupCarousel(carouselEl, totalSlides);

  // 이벤트 바인딩
  const goBack = () => {
    if (typeof onBackToList === 'function') {
      onBackToList();
    } else {
      showToast('상품 목록으로 이동합니다.');
    }
  };

  pageEl.querySelector('[data-action="back-to-list"]')?.addEventListener('click', goBack);
  pageEl.querySelector('[data-action="top-list"]')?.addEventListener('click', goBack);
  pageEl.querySelector('[data-action="back-to-list-bottom"]')?.addEventListener('click', goBack);

  pageEl.querySelector('[data-action="go-write"]')?.addEventListener('click', () => {
    if (typeof onNavigateWrite === 'function') {
      onNavigateWrite();
    } else {
      showToast('글쓰기 화면으로 이동합니다.');
    }
  });

  pageEl.querySelector('[data-action="manner-info"]')?.addEventListener('click', () => {
    showToast('매너온도는 호박 이웃들의 거래 후기를 바탕으로 산정된 신뢰 지표예요.');
  });

  const likeBtn = pageEl.querySelector('[data-action="toggle-like"]');
  likeBtn?.addEventListener('click', async () => {
    likeBtn.disabled = true;
    const result = await toggleLikeAsync(product.id, likesCount);
    likeBtn.disabled = false;
    isLiked = result.liked;
    likesCount = result.likesCount;
    likeBtn.setAttribute('aria-pressed', isLiked ? 'true' : 'false');
    likeBtn.setAttribute('aria-label', `관심 상품 ${isLiked ? '해제' : '등록'}`);
    likeBtn.innerHTML = createHeartSvg(isLiked);
    updateStatsText();
    showToast(isLiked ? '관심 목록에 추가했어요.' : '관심 목록에서 제외했어요.');
  });

  pageEl.querySelector('[data-action="start-chat"]')?.addEventListener('click', () => {
    showToast('판매자와의 채팅방이 열렸습니다!');
  });

  container.innerHTML = '';
  container.appendChild(pageEl);
}

  window.Hobak = Object.assign(window.Hobak || {}, { renderDetailPage });
})();
