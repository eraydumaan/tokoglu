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
    }, 2000);
});

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

document.addEventListener('DOMContentLoaded', () => { fixImageFallbacks();
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
                    // hide the img element to avoid stacking/layout issues
                    img.style.display = 'none';
                }
            }
        });
    }, 300);
});


const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
        if (entry.isIntersecting) {
            entry.target.classList.add("active");
            if (entry.target.classList.contains("stats")) {
                runCounters();
            }
        }
    });
}, { threshold: 0.1 });

document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

let countersStarted = false;
function runCounters() {
    if (countersStarted) {
        return;
    }

    countersStarted = true;
    document.querySelectorAll(".counter").forEach((counter) => {
        const target = Number(counter.getAttribute("data-count"));
        let count = 0;
        const speed = target / 30;

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

const filters = document.querySelectorAll(".filter-node");
const bentoItems = document.querySelectorAll(".bento-item");

filters.forEach((filterButton) => {
    filterButton.addEventListener("click", () => {
        const currentActive = document.querySelector(".filter-node.active");
        if (currentActive) {
            currentActive.classList.remove("active");
        }

        filterButton.classList.add("active");
        const category = filterButton.dataset.target;

        bentoItems.forEach((item) => {
            if (category === "all" || item.dataset.cat === category) {
                item.classList.remove("hide");
            } else {
                item.classList.add("hide");
            }
        });
    });
});

document.querySelectorAll(".ba-container").forEach((container) => {
    const sliderInput = container.querySelector(".ba-scroller");
    const baAfter = container.querySelector(".ba-after");
    const baHandle = container.querySelector(".ba-handle");

    if (sliderInput && baAfter && baHandle) {
        const update = (val) => {
            baAfter.style.width = `${val}%`;
            baHandle.style.left = `${val}%`;
        };
        // initialize based on current value
        update(sliderInput.value);
        sliderInput.addEventListener("input", (e) => {
            update(e.target.value);
        });
        // ensure images are visible in case observer delayed them
        const imgs = container.querySelectorAll('img');
        imgs.forEach(i=>{ i.style.opacity='1'; i.style.visibility='visible'; });
    }
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

const lightbox = document.getElementById("lightboxView");
const lightboxImg = document.getElementById("lightboxImg");
const lightboxClose = document.getElementById("lightboxClose");

bentoItems.forEach((item) => {
    item.addEventListener("click", () => {
        const img = item.querySelector("img");
        if (!img || !lightbox || !lightboxImg) {
            return;
        }
        lightboxImg.setAttribute("src", img.getAttribute("src"));
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
