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

const hero = document.getElementById("heroScene");
const parallaxBg = document.getElementById("parallaxBg");
if (hero && parallaxBg && window.innerWidth > 1024) {
    hero.addEventListener("mousemove", (e) => {
        const x = (e.clientX - window.innerWidth / 2) * 0.03;
        const y = (e.clientY - window.innerHeight / 2) * 0.03;
        parallaxBg.style.transform = `scale(1.05) translate(${x}px, ${y}px)`;
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

const sliderInput = document.getElementById("baSlider");
const baAfter = document.getElementById("baAfter");
const baHandle = document.getElementById("baHandle");

if (sliderInput && baAfter && baHandle) {
    sliderInput.addEventListener("input", (e) => {
        const val = e.target.value;
        baAfter.style.width = `${val}%`;
        baHandle.style.left = `${val}%`;
    });
}

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
