(function () {
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const PRINT_PAGE_HEIGHT_IN = 11;
  const PRINT_MARGIN_TOP_IN = 0.15;
  const PRINT_MARGIN_BOTTOM_IN = 0.5;
  const PRINT_MARGIN_SIDE_IN = 0.25;
  const PRINT_PAGE_WIDTH_IN = 8.5;
  const PRINT_DPI = 96;
  const CONTENT_FOOTER_GAP_IN = 0.25;
  const CONTENT_SAFETY_BUFFER_PX = 20;

  let printState = null;

  function formatNow() {
    const d = new Date();
    let h = d.getHours();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    if (h === 0) h = 12;
    const mm = String(d.getMinutes()).padStart(2, '0');
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()} ${h}:${mm} ${ampm}`;
  }

  function generateWorkerAppId() {
    return " "
  }

  function inchesToPx(inches) {
    return inches * PRINT_DPI;
  }

  function expandTextareasForPrint() {
    document.querySelectorAll('textarea').forEach(function (ta) {
      ta.style.height = 'auto';
      ta.style.height = ta.scrollHeight + 'px';
    });
  }

  function getBlockHeight(el) {
    const style = window.getComputedStyle(el);
    const marginTop = parseFloat(style.marginTop) || 0;
    const marginBottom = parseFloat(style.marginBottom) || 0;
    return el.getBoundingClientRect().height + marginTop + marginBottom;
  }

  function getPrintPageHeightPx() {
    return inchesToPx(PRINT_PAGE_HEIGHT_IN - PRINT_MARGIN_TOP_IN - PRINT_MARGIN_BOTTOM_IN);
  }

  function getPrintContentWidthPx() {
    return inchesToPx(PRINT_PAGE_WIDTH_IN - PRINT_MARGIN_SIDE_IN * 2);
  }

  function buildPageFooter(workerId, submitted, pageNum, totalPages) {
    const footer = document.createElement('footer');
    footer.className = 'print-page-footer';
    footer.innerHTML =
      '<span class="footer-left">Worker App ID: ' + workerId + '</span>' +
      '<span class="footer-right">Submitted: ' + submitted + '<br>Page ' + pageNum + ' of ' + totalPages + '</span>';
    return footer;
  }

  function measureFooterHeight(workerId, submitted) {
    const footer = buildPageFooter(workerId, submitted, 1, 1);
    footer.style.visibility = 'hidden';
    footer.style.position = 'fixed';
    footer.style.left = '-10000px';
    footer.style.top = '0';
    document.body.appendChild(footer);
    const height = footer.offsetHeight;
    footer.remove();
    return height;
  }

  function measureBlocksAtPrintWidth(blockMeta, widthPx) {
    const stage = document.createElement('div');
    stage.className = 'print-block-measure';
    stage.style.position = 'fixed';
    stage.style.left = '-10000px';
    stage.style.top = '0';
    stage.style.visibility = 'hidden';
    stage.style.width = widthPx + 'px';
    document.body.appendChild(stage);

    const heights = blockMeta.map(function (item) {
      stage.appendChild(item.el);
      return getBlockHeight(item.el);
    });

    blockMeta.forEach(function (item) {
      item.section.appendChild(item.el);
    });

    stage.remove();
    return heights;
  }

  function collectBlocks(formWrap) {
    const blockMeta = [];
    formWrap.querySelectorAll('.form-section').forEach(function (section) {
      Array.from(section.children).forEach(function (child) {
        blockMeta.push({ el: child, section: section });
      });
    });
    return blockMeta;
  }

  function paginateBlocks(blockMeta, blockHeights, maxContentHeight) {
    const pages = [];
    let currentPage = [];
    let currentHeight = 0;

    blockMeta.forEach(function (item, index) {
      const blockHeight = blockHeights[index];

      if (currentPage.length && currentHeight + blockHeight > maxContentHeight) {
        pages.push(currentPage);
        currentPage = [];
        currentHeight = 0;
      }

      currentPage.push(item);
      currentHeight += blockHeight;
    });

    if (currentPage.length) {
      pages.push(currentPage);
    }

    return pages;
  }

  function createPrintPage(pageBlocks, workerId, submitted, pageNum, totalPages, contentMaxHeight) {
    const page = document.createElement('div');
    page.className = 'print-page';

    const content = document.createElement('div');
    content.className = 'print-page-content';
    content.style.maxHeight = contentMaxHeight + 'px';

    pageBlocks.forEach(function (item) {
      content.appendChild(item.el);
    });

    page.appendChild(content);
    page.appendChild(buildPageFooter(workerId, submitted, pageNum, totalPages));
    return page;
  }

  function rebalancePrintPages(printPages, workerId, submitted, contentMaxHeight) {
    let guard = 0;

    while (guard < 12) {
      guard += 1;
      let changed = false;
      updatePageFooters(printPages, workerId, submitted);

      const pages = Array.from(printPages.querySelectorAll('.print-page'));

      for (let i = 0; i < pages.length; i += 1) {
        const page = pages[i];
        const content = page.querySelector('.print-page-content');
        if (!content) continue;

        content.style.maxHeight = contentMaxHeight + 'px';
        page.classList.remove('print-page--flowing');

        while (content.scrollHeight > contentMaxHeight + 1 && content.children.length > 1) {
          const lastBlock = content.lastElementChild;
          let nextPage = pages[i + 1];

          if (!nextPage) {
            nextPage = document.createElement('div');
            nextPage.className = 'print-page';
            const nextContent = document.createElement('div');
            nextContent.className = 'print-page-content';
            nextContent.style.maxHeight = contentMaxHeight + 'px';
            nextPage.appendChild(nextContent);
            nextPage.appendChild(buildPageFooter(workerId, submitted, 1, 1));
            printPages.appendChild(nextPage);
            pages.splice(i + 1, 0, nextPage);
          }

          const nextContent = nextPage.querySelector('.print-page-content');
          nextContent.insertBefore(lastBlock, nextContent.firstElementChild);
          changed = true;
        }

        if (content.scrollHeight > contentMaxHeight + 1 && content.children.length === 1) {
          page.classList.add('print-page--flowing');
          content.style.maxHeight = 'none';
        }
      }

      if (!changed) break;
    }

    updatePageFooters(printPages, workerId, submitted);
  }

  function updatePageFooters(printPages, workerId, submitted) {
    const pages = printPages.querySelectorAll('.print-page');
    const totalPages = pages.length;

    pages.forEach(function (page, index) {
      const oldFooter = page.querySelector('.print-page-footer');
      const newFooter = buildPageFooter(workerId, submitted, index + 1, totalPages);
      if (oldFooter) {
        page.replaceChild(newFooter, oldFooter);
      } else {
        page.appendChild(newFooter);
      }
    });
  }

  function paginateForPrint() {
    const formWrap = document.querySelector('.form-wrap');
    if (!formWrap) return;

    restorePrintLayout();
    expandTextareasForPrint();

    const workerId = generateWorkerAppId();
    const submitted = formatNow();
    const pageHeightPx = getPrintPageHeightPx();
    const contentWidthPx = getPrintContentWidthPx();
    const footerHeightPx = measureFooterHeight(workerId, submitted);
    const gapPx = inchesToPx(CONTENT_FOOTER_GAP_IN);
    const contentMaxHeight = pageHeightPx - footerHeightPx - gapPx - CONTENT_SAFETY_BUFFER_PX;

    const blockMeta = collectBlocks(formWrap);
    const blockHeights = measureBlocksAtPrintWidth(blockMeta, contentWidthPx);
    const pages = paginateBlocks(blockMeta, blockHeights, contentMaxHeight);

    const printPages = document.createElement('div');
    printPages.className = 'print-pages';

    pages.forEach(function (pageBlocks, index) {
      printPages.appendChild(
        createPrintPage(pageBlocks, workerId, submitted, index + 1, pages.length, contentMaxHeight)
      );
    });

    formWrap.appendChild(printPages);
    formWrap.classList.add('print-ready');

    rebalancePrintPages(printPages, workerId, submitted, contentMaxHeight);

    printState = {
      blockMeta: blockMeta,
      printPages: printPages
    };
  }

  function restorePrintLayout() {
    if (!printState) return;

    printState.blockMeta.forEach(function (item) {
      item.section.appendChild(item.el);
    });

    if (printState.printPages && printState.printPages.parentNode) {
      printState.printPages.parentNode.removeChild(printState.printPages);
    }

    const formWrap = document.querySelector('.form-wrap');
    if (formWrap) {
      formWrap.classList.remove('print-ready');
    }

    printState = null;
  }

  function preparePrint() {
    paginateForPrint();
  }

  function bindSelectOneGroups() {
    const groups = ['rtw', 'dur', 'rec', 'med', 'rx', 'ex', 'pain'];
    groups.forEach(function (name) {
      const boxes = document.querySelectorAll('input[type="checkbox"][name="' + name + '"]');
      boxes.forEach(function (box) {
        box.addEventListener('change', function () {
          if (box.checked) {
            boxes.forEach(function (other) {
              if (other !== box) other.checked = false;
            });
          }
        });
      });
    });
  }

  window.addEventListener('beforeprint', preparePrint);
  window.addEventListener('afterprint', restorePrintLayout);

  if (window.matchMedia) {
    window.matchMedia('print').addEventListener('change', function (mql) {
      if (mql.matches) {
        preparePrint();
      } else {
        restorePrintLayout();
      }
    });
  }

  bindSelectOneGroups();
})();
