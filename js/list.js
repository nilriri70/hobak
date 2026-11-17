(() => {
  const {
    getProducts,
    fetchProducts,
    CATEGORIES,
    REGIONS,
    POPULAR_KEYWORDS,
    formatPrice,
    formatTimeAgo
  } = window.Hobak;

const SERVICE_TABS = ['전체', '중고거래', '동네업체', '알바', '부동산', '중고차'];
const PAGE_SIZE = 12;

let cachedProducts = getProducts();

const state = {
  activeTab: '중고거래',
  selectedRegion: '전체',
  selectedCategory: '전체',
  searchQuery: '',
  currentPage: 1
};

let currentContainer = null;
let currentOptions = {};

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

function getHobakIconSvg() {
  return `<svg class="list-title-icon" viewBox="0 0 32 32" fill="none" aria-hidden="true">
    <path d="M16 4C16 4 17.5 2 20 2.5" stroke="#2f9e44" stroke-width="2.4" stroke-linecap="round"/>
    <ellipse cx="16" cy="18" rx="12" ry="10" fill="var(--ds-primary)"/>
    <ellipse cx="16" cy="18" rx="6.5" ry="10" fill="#ff8533"/>
    <path d="M16 8V28" stroke="var(--ds-primary-hover)" stroke-width="1.4" stroke-opacity="0.5"/>
  </svg>`;
}

function filterProducts(products) {
  const query = state.searchQuery.trim().toLowerCase();

  return products.filter((product) => {
    if (state.selectedRegion !== '전체') {
      const regionText = `${product.primaryRegion || ''} ${product.region || ''}`;
      if (!regionText.includes(state.selectedRegion)) {
        return false;
      }
    }

    if (state.selectedCategory !== '전체' && product.category !== state.selectedCategory) {
      return false;
    }

    if (query) {
      const searchable = [
        product.title,
        product.category,
        product.region,
        product.description
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase();
      if (!searchable.includes(query)) {
        return false;
      }
    }

    return true;
  });
}

function buildServiceTabsHtml() {
  const items = SERVICE_TABS.map((tab) => {
    const isActive = state.activeTab === tab;
    const activeCls = isActive
      ? 'bg-[var(--ds-text)] text-white border-[var(--ds-text)]'
      : 'bg-white text-[#4d5159] border-[#eaebee] hover:bg-[#f8f9fa]';
    return `<li class="shrink-0">
      <button
        type="button"
        class="px-3.5 py-2 rounded-full border text-sm font-semibold transition-colors whitespace-nowrap ${activeCls}"
        data-tab="${escapeHtml(tab)}"
        aria-pressed="${isActive}"
      >${escapeHtml(tab)}</button>
    </li>`;
  }).join('');

  return `<div class="mb-5 flex items-center justify-between gap-3 flex-wrap">
    <nav class="overflow-x-auto no-scrollbar min-w-0 flex-1" aria-label="서비스 카테고리">
      <ul class="flex items-center gap-2 list-none">${items}</ul>
    </nav>
    <button
      type="button"
      class="ds-btn-primary px-4 py-2 text-sm font-bold shrink-0 transition-all"
      data-action="navigate-write"
    >+ 내 물건 팔기</button>
  </div>`;
}

function buildHeaderHtml(totalCount) {
  const regionLabel = state.selectedRegion === '전체' ? '전체' : state.selectedRegion;
  const titleSuffix =
    state.activeTab === '전체' || state.activeTab === '중고거래'
      ? '중고거래 검색 결과'
      : `${state.activeTab} 검색 결과`;

  const searchBadge = state.searchQuery.trim()
    ? `<span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-[var(--ds-secondary)] text-[var(--ds-primary)] text-xs font-bold">
        '${escapeHtml(state.searchQuery.trim())}'
        <button
          type="button"
          class="inline-flex items-center justify-center w-4 h-4 rounded-full hover:bg-[var(--ds-primary)]/15 text-sm leading-none"
          data-action="clear-search"
          aria-label="검색어 지우기"
        >&times;</button>
      </span>`
    : '';

  return `<header class="flex items-center justify-between gap-3 flex-wrap mb-4">
    <div class="flex items-center gap-2.5 flex-wrap">
      <h1 class="inline-flex items-center gap-2 text-xl md:text-[1.35rem] font-extrabold text-[var(--ds-text)] tracking-tight">
        <span class="w-6 h-6 inline-flex shrink-0">${getHobakIconSvg()}</span>
        <span>${escapeHtml(regionLabel)} ${escapeHtml(titleSuffix)}</span>
      </h1>
      ${searchBadge}
    </div>
    <span class="text-sm font-semibold text-[#868b94]" aria-live="polite">총 ${totalCount}개</span>
  </header>`;
}

function buildFilterBarHtml() {
  const regionOptions = ['전체', ...REGIONS]
    .map(
      (region) =>
        `<option value="${escapeHtml(region)}"${
          state.selectedRegion === region ? ' selected' : ''
        }>${region === '전체' ? '지역: 전체' : escapeHtml(region)}</option>`
    )
    .join('');

  const categoryOptions = ['전체', ...CATEGORIES]
    .map(
      (category) =>
        `<option value="${escapeHtml(category)}"${
          state.selectedCategory === category ? ' selected' : ''
        }>${category === '전체' ? '카테고리: 전체' : escapeHtml(category)}</option>`
    )
    .join('');

  return `<section class="flex items-center gap-2.5 flex-wrap mb-6 pb-4 border-b border-[#eaebee]" aria-label="검색 필터">
    <div>
      <label for="filter-region" class="sr-only">지역 선택</label>
      <select id="filter-region" class="h-9 px-3 rounded-lg border border-[#dcdee3] bg-white text-sm font-medium text-[var(--ds-text)] focus:outline-none focus:border-[var(--ds-text)]" data-filter="region">
        ${regionOptions}
      </select>
    </div>
    <div>
      <label for="filter-category" class="sr-only">카테고리 선택</label>
      <select id="filter-category" class="h-9 px-3 rounded-lg border border-[#dcdee3] bg-white text-sm font-medium text-[var(--ds-text)] focus:outline-none focus:border-[var(--ds-text)]" data-filter="category">
        ${categoryOptions}
      </select>
    </div>
    <button type="button" class="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg border border-[#eaebee] bg-[#f8f9fa] hover:bg-[#f2f3f6] text-xs font-semibold text-[#4d5159] transition-colors" data-action="reset-filters">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
        <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
        <path d="M3 3v5h5"/>
      </svg>
      <span>필터 초기화</span>
    </button>
  </section>`;
}

function buildProductCardHtml(product) {
  const thumbSrc =
    Array.isArray(product.images) && product.images.length > 0 ? product.images[0] : '';
  const displayRegion = product.primaryRegion || product.region || '한남동';
  const sellerName = product.sellerName || '호박이웃';
  const timeText = formatTimeAgo(product.createdAt);
  const priceText = formatPrice(product.price, product.isFree);
  const likesCount = Number(product.likes) || 0;
  const status = product.status || 'on_sale';
  const isSold = status === 'sold';
  const isReserved = status === 'reserved';

  const statusTagHtml = isSold
    ? '<span class="px-2 py-0.5 rounded-md bg-[#4d5159] text-white text-[0.7rem] font-bold">거래완료</span>'
    : isReserved
      ? '<span class="px-2 py-0.5 rounded-md bg-emerald-600 text-white text-[0.7rem] font-bold">예약중</span>'
      : '<span class="px-2 py-0.5 rounded-md bg-[var(--ds-secondary)] text-[var(--ds-primary)] text-[0.7rem] font-bold">판매중</span>';

  const payBadgeHtml = product.payEnabled
    ? `<span class="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-[var(--ds-secondary)] text-[var(--ds-primary)] text-[0.7rem] font-bold">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
          <path d="M12 2L4 5v6.09c0 5.05 3.41 9.76 8 10.91 4.59-1.15 8-5.86 8-10.91V5l-8-3z"/>
        </svg>
        호박페이
      </span>`
    : '<span></span>';

  return `<li>
    <article class="group ${isSold ? 'opacity-55 transition-opacity' : ''}">
      <button
        type="button"
        class="w-full text-left flex flex-col rounded-xl focus-visible:outline focus-visible:outline-2 focus-visible:outline-[var(--ds-primary)]"
        data-product-id="${escapeHtml(product.id)}"
        aria-label="${escapeHtml(product.title)}, ${escapeHtml(priceText)}"
      >
        <div class="relative w-full aspect-square rounded-xl overflow-hidden bg-[#f2f3f6] border border-[#eaebee] mb-2.5">
          <img
            class="w-full h-full object-cover group-hover:scale-[1.03] transition-transform duration-200 ${isSold ? 'grayscale-[35%]' : ''}"
            src="${escapeHtml(thumbSrc)}"
            alt="${escapeHtml(product.title)}"
            loading="lazy"
          />
          <div class="absolute top-2 left-2 z-10">${statusTagHtml}</div>
        </div>
        <div class="px-0.5">
          <h2 class="text-[0.9375rem] font-medium text-[var(--ds-text)] leading-snug line-clamp-2 min-h-[2.6em]">${escapeHtml(product.title)}</h2>
          <p class="text-[0.9375rem] font-extrabold text-[var(--ds-text)] mt-1">${escapeHtml(priceText)}</p>
          <p class="text-xs text-[#868b94] mt-0.5 truncate">${escapeHtml(sellerName)} · ${escapeHtml(displayRegion)} · ${escapeHtml(timeText)}</p>
          <div class="flex items-center justify-between mt-2">
            ${payBadgeHtml}
            <span class="inline-flex items-center gap-1 text-xs text-[#868b94]" aria-label="관심 ${likesCount}개">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
              </svg>
              <span>${likesCount}</span>
            </span>
          </div>
        </div>
      </button>
    </article>
  </li>`;
}

function buildEmptyStateHtml() {
  const isUnsupportedTab = state.activeTab !== '전체' && state.activeTab !== '중고거래';

  const title = isUnsupportedTab
    ? `'${state.activeTab}' 서비스는 준비 중이에요`
    : '검색 결과가 없어요';

  const desc = isUnsupportedTab
    ? '지금은 중고거래 탭에서 우리 동네의 다양한 매물을 만나볼 수 있어요.'
    : '다른 검색어나 필터를 선택하거나, 직접 내 물건을 판매해 보세요!';

  const secondaryBtn = isUnsupportedTab
    ? `<button type="button" class="px-4 py-2 rounded-md border border-[#dcdee3] bg-white hover:bg-[#f8f9fa] text-sm font-semibold" data-tab="중고거래">중고거래 보기</button>`
    : `<button type="button" class="px-4 py-2 rounded-md border border-[#dcdee3] bg-white hover:bg-[#f8f9fa] text-sm font-semibold" data-action="reset-filters">필터 초기화</button>`;

  return `<div class="py-16 px-4 text-center border border-[#eaebee] rounded-2xl bg-[#f8f9fa]" role="status">
    <svg class="w-12 h-12 mx-auto mb-3 text-[#868b94]" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8"/>
      <path d="m21 21-4.3-4.3"/>
    </svg>
    <h2 class="text-lg font-bold text-[var(--ds-text)] mb-1.5">${escapeHtml(title)}</h2>
    <p class="text-sm text-[#868b94] mb-5">${escapeHtml(desc)}</p>
    <div class="flex items-center justify-center gap-2.5">
      <button type="button" class="px-4 py-2 rounded-md bg-[var(--ds-primary)] hover:bg-[var(--ds-primary-hover)] text-white text-sm font-bold" data-action="navigate-write">내 물건 팔기</button>
      ${secondaryBtn}
    </div>
  </div>`;
}

function buildPaginationHtml(totalPages) {
  if (totalPages <= 1) return '';

  const pageButtons = Array.from({ length: totalPages }, (_, idx) => {
    const page = idx + 1;
    const isActive = page === state.currentPage;
    const cls = isActive
      ? 'bg-[var(--ds-text)] text-white border-[var(--ds-text)]'
      : 'bg-white text-[#4d5159] border-transparent hover:bg-[#f2f3f6]';
    return `<button
      type="button"
      class="w-8 h-8 rounded-full border text-sm font-semibold inline-flex items-center justify-center transition-colors ${cls}"
      data-page="${page}"
      ${isActive ? 'aria-current="page"' : ''}
      aria-label="${page}페이지"
    >${page}</button>`;
  }).join('');

  return `<nav class="flex items-center justify-center gap-1.5 mt-10" aria-label="페이지네이션">
    <button
      type="button"
      class="w-8 h-8 rounded-full text-sm font-semibold text-[#4d5159] hover:bg-[#f2f3f6] disabled:opacity-35 disabled:pointer-events-none"
      data-page="${state.currentPage - 1}"
      ${state.currentPage <= 1 ? 'disabled' : ''}
      aria-label="이전 페이지"
    >&lt;</button>
    ${pageButtons}
    <button
      type="button"
      class="w-8 h-8 rounded-full text-sm font-semibold text-[#4d5159] hover:bg-[#f2f3f6] disabled:opacity-35 disabled:pointer-events-none"
      data-page="${state.currentPage + 1}"
      ${state.currentPage >= totalPages ? 'disabled' : ''}
      aria-label="다음 페이지"
    >&gt;</button>
  </nav>`;
}

function buildSidebarHtml() {
  const activeQuery = state.searchQuery.trim().toLowerCase();
  const chips = POPULAR_KEYWORDS.map((keyword) => {
    const isActive = activeQuery === keyword.toLowerCase();
    const cls = isActive
      ? 'bg-[var(--ds-text)] text-white border-[var(--ds-text)]'
      : 'bg-white text-[#4d5159] border-[#dcdee3] hover:bg-[#f8f9fa]';
    return `<button
      type="button"
      class="px-3 py-1.5 rounded-full border text-xs font-medium transition-colors ${cls}"
      data-keyword="${escapeHtml(keyword)}"
      aria-pressed="${isActive}"
    >${escapeHtml(keyword)}</button>`;
  }).join('');

  return `<aside class="lg:sticky lg:top-28 ds-surface p-4" aria-label="인기 검색어">
    <h2 class="text-sm font-extrabold text-[var(--ds-text)] mb-3 flex items-center gap-1.5">
      <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--ds-primary)" stroke-width="2.2" aria-hidden="true">
        <circle cx="11" cy="11" r="8"></circle>
        <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
      </svg>
      인기 검색어
    </h2>
    <div class="flex flex-wrap gap-2">${chips}</div>
  </aside>`;
}

function updateView() {
  if (!currentContainer) return;

  const isTradeTab = state.activeTab === '전체' || state.activeTab === '중고거래';
  const allProducts = isTradeTab ? cachedProducts : [];
  const filtered = isTradeTab ? filterProducts(allProducts) : [];

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  if (state.currentPage > totalPages) {
    state.currentPage = totalPages;
  }

  const startIdx = (state.currentPage - 1) * PAGE_SIZE;
  const pageItems = filtered.slice(startIdx, startIdx + PAGE_SIZE);

  const mainContentHtml =
    pageItems.length > 0
      ? `<ul class="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-7 list-none">${pageItems.map(buildProductCardHtml).join('')}</ul>
         ${buildPaginationHtml(totalPages)}`
      : buildEmptyStateHtml();

  currentContainer.innerHTML = `<div class="max-w-[1080px] mx-auto px-4 md:px-5 py-6">
    ${buildServiceTabsHtml()}
    ${buildHeaderHtml(filtered.length)}
    ${buildFilterBarHtml()}
    <div class="grid grid-cols-1 lg:grid-cols-[1fr_240px] gap-8 items-start">
      <div class="min-w-0">
        ${mainContentHtml}
      </div>
      ${buildSidebarHtml()}
    </div>
  </div>`;

  bindEvents();
}

function resetFilters() {
  state.selectedRegion = '전체';
  state.selectedCategory = '전체';
  state.searchQuery = '';
  state.currentPage = 1;
  currentOptions.onSearchChange?.('');
  updateView();
}

function bindEvents() {
  if (!currentContainer) return;

  currentContainer.querySelectorAll('[data-tab]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const nextTab = btn.getAttribute('data-tab');
      if (!nextTab || nextTab === state.activeTab) return;
      state.activeTab = nextTab;
      state.currentPage = 1;
      updateView();
    });
  });

  const regionSelect = currentContainer.querySelector('[data-filter="region"]');
  regionSelect?.addEventListener('change', (e) => {
    state.selectedRegion = e.target.value;
    state.currentPage = 1;
    updateView();
  });

  const categorySelect = currentContainer.querySelector('[data-filter="category"]');
  categorySelect?.addEventListener('change', (e) => {
    state.selectedCategory = e.target.value;
    state.currentPage = 1;
    updateView();
  });

  currentContainer.querySelectorAll('[data-action="reset-filters"]').forEach((btn) => {
    btn.addEventListener('click', resetFilters);
  });

  currentContainer.querySelectorAll('[data-action="clear-search"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      state.searchQuery = '';
      state.currentPage = 1;
      currentOptions.onSearchChange?.('');
      updateView();
    });
  });

  currentContainer.querySelectorAll('[data-action="navigate-write"]').forEach((btn) => {
    btn.addEventListener('click', () => {
      currentOptions.onNavigateWrite?.();
    });
  });

  currentContainer.querySelectorAll('[data-product-id]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const productId = btn.getAttribute('data-product-id');
      if (productId) {
        currentOptions.onSelectProduct?.(productId);
      }
    });
  });

  currentContainer.querySelectorAll('[data-keyword]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const keyword = btn.getAttribute('data-keyword') || '';
      const isSame = state.searchQuery.trim().toLowerCase() === keyword.toLowerCase();
      const nextQuery = isSame ? '' : keyword;
      state.searchQuery = nextQuery;
      state.activeTab = '중고거래';
      state.currentPage = 1;
      currentOptions.onSearchChange?.(nextQuery);
      updateView();
    });
  });

  currentContainer.querySelectorAll('[data-page]').forEach((btn) => {
    btn.addEventListener('click', () => {
      if (btn.disabled) return;
      const nextPage = Number(btn.getAttribute('data-page'));
      if (!Number.isFinite(nextPage) || nextPage === state.currentPage) return;
      state.currentPage = nextPage;
      updateView();
      currentContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

function renderListPage(container, options = {}) {
  if (!container) return;

  const incomingQuery = typeof options.searchQuery === 'string' ? options.searchQuery : '';
  if (incomingQuery !== state.searchQuery) {
    state.searchQuery = incomingQuery;
    state.currentPage = 1;
  }

  currentContainer = container;
  currentOptions = options;
  cachedProducts = getProducts();
  updateView();

  if (typeof fetchProducts === 'function') {
    fetchProducts().then((remoteProducts) => {
      if (Array.isArray(remoteProducts) && currentContainer === container) {
        cachedProducts = remoteProducts;
        updateView();
      }
    });
  }
}

  window.Hobak = Object.assign(window.Hobak || {}, { renderListPage });
})();
