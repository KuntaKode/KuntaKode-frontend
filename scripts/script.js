document.addEventListener('DOMContentLoaded', () => {

    // --- Reusable Carousel Initialization Function ---
    function initializeCarousel(
        containerId,
        cardClass,
        prevArrowId,
        nextArrowId,
        dotsContainerId = null, // Optional: pass null if no dots needed
        enableAutoScroll = true // Option to control auto-scroll (defaults to true)
    ) {
        const cardsContainer = document.getElementById(containerId);
        const memberCards = cardsContainer.querySelectorAll(`.${cardClass}`); // Use cardClass here
        const dotsContainer = dotsContainerId ? document.getElementById(dotsContainerId) : null;

        const prevArrow = document.getElementById(prevArrowId);
        const nextArrow = document.getElementById(nextArrowId);

        if (memberCards.length === 0) {
            if (prevArrow) prevArrow.style.display = 'none';
            if (nextArrow) nextArrow.style.display = 'none';
            if (dotsContainer) dotsContainer.style.display = 'none';
            return;
        }

        let scrollInterval;
        let currentCardIndex = 0;
        const SCROLL_DELAY = 3000;

        let isAutoScrolling = false;

        let pageScrollLeftPositions = [];
        const SCROLL_POSITION_TOLERANCE = 10;

        const calculateAndCreateDots = () => {
            if (!dotsContainer) return;

            dotsContainer.innerHTML = '';
            pageScrollLeftPositions = [];

            const maxScrollLeft = cardsContainer.scrollWidth - cardsContainer.clientWidth;

            if (maxScrollLeft <= SCROLL_POSITION_TOLERANCE) {
                dotsContainer.style.display = 'none';
                return;
            } else {
                dotsContainer.style.display = 'flex';
            }

            const uniqueScrollPositions = new Set();
            uniqueScrollPositions.add(0);

            memberCards.forEach(card => {
                uniqueScrollPositions.add(Math.round(card.offsetLeft));
            });

            let foundMaxScroll = false;
            for (const pos of uniqueScrollPositions) {
                if (Math.abs(pos - maxScrollLeft) < SCROLL_POSITION_TOLERANCE) {
                    foundMaxScroll = true;
                    break;
                }
            }
            if (!foundMaxScroll && maxScrollLeft > SCROLL_POSITION_TOLERANCE) {
                uniqueScrollPositions.add(Math.round(maxScrollLeft));
            }

            pageScrollLeftPositions = Array.from(uniqueScrollPositions).sort((a, b) => a - b);

            pageScrollLeftPositions = pageScrollLeftPositions.filter((pos, index, arr) => {
                if (index === 0) return true;
                return Math.abs(pos - arr[index - 1]) > SCROLL_POSITION_TOLERANCE;
            });

            pageScrollLeftPositions.forEach((scrollPos, i) => {
                const dot = document.createElement('span');
                dot.classList.add('carousel-dot');
                dot.dataset.pageIndex = i;

                dot.addEventListener('click', () => {
                    cardsContainer.scrollTo({
                        left: pageScrollLeftPositions[i],
                        behavior: 'smooth'
                    });
                    resetAutoScroll();
                });
                dotsContainer.appendChild(dot);
            });
        };

        const updateActiveDot = () => {
            if (!dotsContainer || pageScrollLeftPositions.length === 0 || dotsContainer.style.display === 'none') return;

            const dots = dotsContainer.querySelectorAll('.carousel-dot');
            const containerScrollLeft = cardsContainer.scrollLeft;

            let activePageIndex = 0;
            let minDiff = Infinity;

            pageScrollLeftPositions.forEach((pos, index) => {
                const diff = Math.abs(pos - containerScrollLeft);
                if (diff < minDiff || (diff < SCROLL_POSITION_TOLERANCE && index > activePageIndex)) {
                    minDiff = diff;
                    activePageIndex = index;
                }
            });

            const maxScrollLeft = cardsContainer.scrollWidth - cardsContainer.clientWidth;
            if (Math.abs(containerScrollLeft - maxScrollLeft) < SCROLL_POSITION_TOLERANCE && pageScrollLeftPositions.length > 0) {
                activePageIndex = pageScrollLeftPositions.length - 1;
            }

            dots.forEach((dot, index) => {
                if (index === activePageIndex) {
                    dot.classList.add('active');
                } else {
                    dot.classList.remove('active');
                }
            });
        };

        const updateCarouselDisplay = () => {
            if (!prevArrow || !nextArrow) return;

            const maxScrollLeft = cardsContainer.scrollWidth - cardsContainer.clientWidth;
            const contentFits = maxScrollLeft <= SCROLL_POSITION_TOLERANCE;

            if (contentFits) {
                prevArrow.style.display = 'none';
                nextArrow.style.display = 'none';
                cardsContainer.style.justifyContent = 'space-evenly';
                if (dotsContainer) dotsContainer.style.display = 'none';
                clearInterval(scrollInterval);
            } else {
                prevArrow.style.display = '';
                nextArrow.style.display = '';
                cardsContainer.style.justifyContent = 'flex-start';
                if (dotsContainer) dotsContainer.style.display = 'flex';

                const atStart = cardsContainer.scrollLeft <= 5;
                const atEnd = maxScrollLeft > 0 && (cardsContainer.scrollLeft >= maxScrollLeft - 5);

                if (atStart) {
                    prevArrow.setAttribute('disabled', 'true');
                    prevArrow.classList.add('arrow-disabled');
                } else {
                    prevArrow.removeAttribute('disabled');
                    prevArrow.classList.remove('arrow-disabled');
                }

                if (atEnd) {
                    nextArrow.setAttribute('disabled', 'true');
                    nextArrow.classList.add('arrow-disabled');
                } else {
                    nextArrow.removeAttribute('disabled');
                    nextArrow.classList.remove('arrow-disabled');
                }
            }
        };

        const scrollToCard = (index, behavior = 'smooth') => {
            let targetIndex = index;

            if (!isAutoScrolling) {
                if (targetIndex >= memberCards.length) {
                    targetIndex = memberCards.length - 1;
                } else if (targetIndex < 0) {
                    targetIndex = 0;
                }
            }
            currentCardIndex = targetIndex;

            const targetCard = memberCards[currentCardIndex];
            if (targetCard) {
                cardsContainer.scrollTo({
                    left: targetCard.offsetLeft,
                    behavior: behavior
                });

                setTimeout(() => {
                    updateCarouselDisplay();
                    updateActiveDot();
                }, behavior === 'smooth' ? 600 : 50);
            }
        };

        const autoScroll = () => {
            isAutoScrolling = true;
            currentCardIndex++;
            if (currentCardIndex >= memberCards.length) {
                currentCardIndex = 0;
            }
            scrollToCard(currentCardIndex);
            isAutoScrolling = false;
        };

        const resetAutoScroll = () => {
            clearInterval(scrollInterval);
            // Check `enableAutoScroll` flag before starting interval
            if (enableAutoScroll && (cardsContainer.scrollWidth - cardsContainer.clientWidth > SCROLL_POSITION_TOLERANCE)) {
                scrollInterval = setInterval(autoScroll, SCROLL_DELAY);
            }
        };

        // --- Initial Setup ---
        calculateAndCreateDots();
        scrollToCard(currentCardIndex, 'auto');
        updateCarouselDisplay();
        updateActiveDot();
        resetAutoScroll(); // This will only start if `enableAutoScroll` is true

        // --- Event Listeners ---
        cardsContainer.addEventListener('scroll', () => {
            clearTimeout(cardsContainer._scrollTimeout);
            cardsContainer._scrollTimeout = setTimeout(() => {
                updateCarouselDisplay();
                updateActiveDot();
                resetAutoScroll();
            }, 150);
        });

        window.addEventListener('resize', () => {
            calculateAndCreateDots();
            currentCardIndex = 0;
            scrollToCard(currentCardIndex, 'auto');
            updateCarouselDisplay();
            updateActiveDot();
            resetAutoScroll();
        });

        if (prevArrow) {
            prevArrow.addEventListener('click', () => {
                if (prevArrow.hasAttribute('disabled')) return;
                currentCardIndex--;
                scrollToCard(currentCardIndex);
                resetAutoScroll();
            });
        }

        if (nextArrow) {
            nextArrow.addEventListener('click', () => {
                if (nextArrow.hasAttribute('disabled')) return;
                currentCardIndex++;
                scrollToCard(currentCardIndex);
                resetAutoScroll();
            });
        }

        cardsContainer.addEventListener('mouseenter', () => clearInterval(scrollInterval));
        cardsContainer.addEventListener('mouseleave', () => resetAutoScroll());
    }

    // --- Initialize Your Carousels ---

    // 1. Members Carousel
    initializeCarousel(
        'members-container',
        'member-card',
        'previous-member',
        'next-member',
        'dots-container', // Provide dots container ID
        true // Enable auto-scroll for members (already true)
    );

    // 2. Projects Carousel
    initializeCarousel(
        'projects-container',
        'project-card',
        'previous-project',
        'next-project',
        null, // Pass null because no dots are needed for projects
        true // <--- CHANGED THIS TO TRUE: Enable auto-scroll for projects
    );

});