const PAGE_ORDER = ['/index.html', '/', '/descoberta.html', '/contato.html', '/carrinho.html'];

function getPageIndex(href) {
    try {
        const url = new URL(href, location.href);
        const path = url.pathname;
        const normalized = path === '/' ? '/' : path;
        const idx = PAGE_ORDER.indexOf(normalized);
        return idx !== -1 ? idx : PAGE_ORDER.indexOf(path);
    } catch {
        return -1;
    }
}

const currentIndex = getPageIndex(location.pathname);

document.addEventListener('click', (e) => {
    const link = e.target.closest('a[href]');
    if (!link) return;

    const destIndex = getPageIndex(link.getAttribute('href'));

    if (destIndex === -1 || currentIndex === -1) {
        document.documentElement.removeAttribute('data-vt-direction');
        return;
    }

    if (destIndex < currentIndex) {
        document.documentElement.setAttribute('data-vt-direction', 'back');
    } else {
        document.documentElement.removeAttribute('data-vt-direction');
    }
}, { capture: true });