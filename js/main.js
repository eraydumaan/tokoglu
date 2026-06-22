document.addEventListener("DOMContentLoaded", () => {
    const loader = document.getElementById("loader");
    setTimeout(() => {
        if (loader) {
            loader.style.opacity = "0";
            loader.style.pointerEvents = "none";
            loader.style.transform = "scale(1.05)";
            setTimeout(() => {
                loader.style.display = "none";
            }, 800);
        }
    }, 1000);

});

function optimizeImageLoading() {
    document.querySelectorAll("img").forEach((img, index) => {
        img.decoding = "async";
        if (index === 0 || img.closest(".hero-video-container")) {
            img.loading = "eager";
            img.setAttribute("fetchpriority", "high");
        } else if (!img.hasAttribute("loading")) {
            img.loading = "lazy";
        }
    });
}

// Fix image loading when filenames contain Turkish characters vs ASCII aliases.
function fixImageFallbacks() {
    const map = { 'ö':'o','Ö':'O','ü':'u','Ü':'U','ş':'s','Ş':'S','ı':'i','İ':'I','ğ':'g','Ğ':'G','ç':'c','Ç':'C' };
    const normalize = (s) => s.split('').map(ch => map[ch] || ch).join('');

    document.querySelectorAll('img').forEach((img) => {
        const trySwap = () => {
            try {
                if (img.naturalWidth && img.naturalWidth > 0) return; // already loaded
            } catch (e) {}
            const src = img.getAttribute('src');
            if (!src) return;
            const parts = src.split('/');
            const file = parts.pop();
            const altFile = normalize(file);
            if (altFile === file) return;
            const altSrc = parts.concat([altFile]).join('/');
            // Check altSrc exists before swapping
            fetch(altSrc, { method: 'HEAD' }).then(res => {
                if (res.ok) img.src = altSrc;
            }).catch(() => {});
        };

        img.addEventListener('error', trySwap);
        // in case image already failed to load earlier, check after short delay
        setTimeout(trySwap, 400);
    });
}

document.addEventListener('DOMContentLoaded', () => {
    optimizeImageLoading();
    fixImageFallbacks();
    // Set BA container backgrounds from img src as a robust fallback
    setTimeout(() => {
        document.querySelectorAll('.ba-img').forEach(parent => {
            const img = parent.querySelector('img');
            if (img) {
                const src = img.getAttribute('src');
                if (src) {
                    parent.style.backgroundImage = `url(${src})`;
                    parent.style.backgroundSize = 'cover';
                    parent.style.backgroundPosition = 'center';
                }
            }
        });
    }, 300);
});

const menuToggle = document.querySelector(".menu-toggle");
const siteNav = document.querySelector("header nav");

if (menuToggle && siteNav) {
    const closeMenu = () => {
        menuToggle.classList.remove("active");
        siteNav.classList.remove("active");
        document.body.classList.remove("menu-open");
        menuToggle.setAttribute("aria-expanded", "false");
        menuToggle.setAttribute("aria-label", "Menüyü aç");
    };

    menuToggle.addEventListener("click", () => {
        const isOpen = siteNav.classList.toggle("active");
        menuToggle.classList.toggle("active", isOpen);
        document.body.classList.toggle("menu-open", isOpen);
        menuToggle.setAttribute("aria-expanded", String(isOpen));
        menuToggle.setAttribute("aria-label", isOpen ? "Menüyü kapat" : "Menüyü aç");
    });

    siteNav.querySelectorAll("a").forEach((link) => {
        link.addEventListener("click", closeMenu);
    });
}

let countersStarted = false;

function resetCounters() {
    countersStarted = false;
    document.querySelectorAll(".counter").forEach((counter) => {
        counter.innerText = "0";
    });
}

function runCounters({ restart = false } = {}) {
    if (countersStarted && !restart) {
        return;
    }

    countersStarted = true;
    document.querySelectorAll(".counter").forEach((counter) => {
        const target = Number(counter.getAttribute("data-count"));
        let count = 0;
        const speed = target / 30;

        counter.innerText = "0";

        const updateCount = () => {
            count += speed;
            if (count < target) {
                counter.innerText = `${Math.floor(count)}+`;
                setTimeout(updateCount, 25);
            } else {
                counter.innerText = `${target}+`;
            }
        };

        updateCount();
    });
}

const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add("active");
            if (entry.target.classList.contains("stats")) {
                runCounters();
            }
        }
    });
}, { threshold: 0, rootMargin: "0px 0px -8% 0px" });

resetCounters();

document.querySelectorAll(".reveal").forEach((el) => {
    const rect = el.getBoundingClientRect();
    const isInViewport = rect.top < window.innerHeight && rect.bottom > 0;

    if (isInViewport) {
        el.classList.add("active");
        if (el.classList.contains("stats")) {
            runCounters({ restart: true });
        }
    }

    observer.observe(el);
});

window.addEventListener("pageshow", () => {
    const stats = document.querySelector(".stats");
    if (!stats) return;

    const rect = stats.getBoundingClientRect();
    const isVisible = rect.top < window.innerHeight && rect.bottom > 0;
    if (isVisible) {
        runCounters({ restart: true });
    }
});

const getImageOrientation = (img) => {
    const width = img.naturalWidth || Number(img.dataset.width) || Number(img.getAttribute("width")) || 0;
    const height = img.naturalHeight || Number(img.dataset.height) || Number(img.getAttribute("height")) || 0;

    if (!width || !height) {
        return "standard";
    }

    const ratio = width / height;
    if (ratio >= 1.55) return "wide";
    if (ratio >= 1.08) return "landscape";
    if (ratio <= 0.82) return "portrait";
    return "standard";
};

const classifyGalleryItem = (item) => {
    const img = item.querySelector("img");
    if (!img) return "standard";

    const orientation = getImageOrientation(img);
    item.dataset.orientation = orientation;
    item.classList.remove("is-wide", "is-landscape", "is-portrait", "is-standard");
    item.classList.add(`is-${orientation}`);
    return orientation;
};

document.querySelectorAll(".bento-item, .insta-item").forEach((item, index) => {
    item.dataset.originalOrder = String(index);
    const img = item.querySelector("img");
    if (!img) return;

    if (img.complete) {
        classifyGalleryItem(item);
    } else {
        img.addEventListener("load", () => classifyGalleryItem(item), { once: true });
    }
});

document.querySelectorAll(".showcase .gallery-filters").forEach((filterGroup) => {
    const section = filterGroup.closest("section");
    const items = section ? section.querySelectorAll(".bento-item, .insta-item") : [];
    const grid = section ? section.querySelector(".bento-grid, .insta-grid") : null;

    filterGroup.querySelectorAll(".filter-node").forEach((filterButton) => {
        filterButton.addEventListener("click", () => {
            const currentActive = filterGroup.querySelector(".filter-node.active");
            if (currentActive) {
                currentActive.classList.remove("active");
            }

            filterButton.classList.add("active");
            const category = filterButton.dataset.target;
            section?.classList.toggle("is-filtered", category !== "all");

            items.forEach((item) => {
                if (category === "all" || item.dataset.cat === category) {
                    item.classList.remove("hide");
                } else {
                    item.classList.add("hide");
                }
            });

            if (grid) {
                const orderedItems = Array.from(items).sort((a, b) => {
                    if (category === "all") {
                        return Number(a.dataset.originalOrder) - Number(b.dataset.originalOrder);
                    }

                    const getNumber = (item) => {
                        const title = item.querySelector("h3")?.textContent || "";
                        const match = title.match(/(\d+)\s*$/);
                        return match ? Number(match[1]) : Number(item.dataset.originalOrder);
                    };

                    return getNumber(a) - getNumber(b);
                });

                orderedItems.forEach((item) => grid.appendChild(item));
            }
        });
    });

    filterGroup.querySelector(".filter-node.active")?.click();
});

const stepItems = document.querySelectorAll(".step-item");
const processImages = document.querySelectorAll(".process-img");

stepItems.forEach((item, index) => {
    item.addEventListener("mouseenter", () => {
        const activeStep = document.querySelector(".step-item.active");
        const activeImage = document.querySelector(".process-img.active");

        if (activeStep) {
            activeStep.classList.remove("active");
        }

        if (activeImage) {
            activeImage.classList.remove("active");
        }

        item.classList.add("active");
        if (processImages[index]) {
            processImages[index].classList.add("active");
        }
    });
});

if (window.Swiper) {
    new Swiper("#testiSwiper", {
        slidesPerView: 1,
        spaceBetween: 30,
        pagination: {
            el: ".swiper-pagination",
            clickable: true
        },
        breakpoints: {
            768: {
                slidesPerView: 2
            }
        }
    });
}

const lightbox = document.getElementById("lightboxView");
const lightboxImg = document.getElementById("lightboxImg");
const lightboxClose = document.getElementById("lightboxClose");

document.querySelectorAll(".bento-item, .insta-item").forEach((item) => {
    item.addEventListener("click", () => {
        const img = item.querySelector("img");
        if (!img || !lightbox || !lightboxImg) {
            return;
        }
        lightboxImg.setAttribute("src", img.getAttribute("src"));
        lightboxImg.setAttribute("alt", img.getAttribute("alt") || "Büyük Görsel");
        lightbox.classList.add("active");
    });
});

if (lightboxClose && lightbox) {
    lightboxClose.addEventListener("click", () => {
        lightbox.classList.remove("active");
    });
}

if (lightbox) {
    lightbox.addEventListener("click", (e) => {
        if (e.target === lightbox) {
            lightbox.classList.remove("active");
        }
    });
}
