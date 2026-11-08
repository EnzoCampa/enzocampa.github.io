
"use strict";

/**
 * Portfolio — Main JavaScript
 *
 * Shared interactions:
 * - Mobile navigation
 * - Section navigation
 * - Active section tracking
 * - Image fallbacks
 *
 * No external dependencies.
 */

/* ==========================================================
   01. CONFIGURATION
   ========================================================== */

const CONFIG = Object.freeze({
    mobileBreakpoint: 760,
    sectionActivationRatio: 0.4,
    scrollThrottle: 100,
});

/* ==========================================================
   02. DOM UTILITIES
   ========================================================== */

/**
 * Returns the first matching element.
 *
 * @param {string} selector
 * @param {ParentNode} [parent=document]
 * @returns {Element|null}
 */
function getElement(selector, parent = document) {
    return parent.querySelector(selector);
}

/**
 * Returns all matching elements as an array.
 *
 * @param {string} selector
 * @param {ParentNode} [parent=document]
 * @returns {Element[]}
 */
function getElements(selector, parent = document) {
    return Array.from(parent.querySelectorAll(selector));
}

/* ==========================================================
   03. MOBILE NAVIGATION
   ========================================================== */

/**
 * Initializes the responsive navigation menu.
 */
function initMobileNavigation() {
    const menuButton = getElement(".menu-button");
    const navigation = getElement(".primary-navigation");

    if (!menuButton || !navigation) {
        return;
    }

    /**
     * Updates menu visibility and accessibility attributes.
     *
     * @param {boolean} isOpen
     */
    function setMenuState(isOpen) {
        navigation.classList.toggle("is-open", isOpen);

        menuButton.setAttribute(
            "aria-expanded",
            String(isOpen)
        );

        menuButton.setAttribute(
            "aria-label",
            document.documentElement.lang === "en"
                ? (isOpen ? "Close menu" : "Open menu")
                : (isOpen ? "Fermer le menu" : "Ouvrir le menu")
        );
    }

    /**
     * Toggles the mobile navigation menu.
     */
    function toggleMenu() {
        const isOpen = navigation.classList.contains("is-open");

        setMenuState(!isOpen);
    }

    /**
     * Closes the mobile navigation menu.
     */
    function closeMenu() {
        setMenuState(false);
    }

    // Initial state.
    setMenuState(false);

    // Toggle on button click.
    menuButton.addEventListener("click", toggleMenu);

    // Close after selecting a navigation link.
    getElements("a", navigation).forEach((link) => {
        link.addEventListener("click", closeMenu);
    });

    // Close when clicking outside the navigation.
    document.addEventListener("click", (event) => {
        const target = event.target;

        if (!(target instanceof Node)) {
            return;
        }

        const isInsideNavigation = navigation.contains(target);
        const isInsideButton = menuButton.contains(target);

        if (!isInsideNavigation && !isInsideButton) {
            closeMenu();
        }
    });

    // Close using the Escape key.
    document.addEventListener("keydown", (event) => {
        if (event.key !== "Escape") {
            return;
        }

        if (!navigation.classList.contains("is-open")) {
            return;
        }

        closeMenu();
        menuButton.focus();
    });

    // Reset when returning to desktop layout.
    const desktopMediaQuery = window.matchMedia(
        `(min-width: ${CONFIG.mobileBreakpoint + 1}px)`
    );

    desktopMediaQuery.addEventListener("change", (event) => {
        if (event.matches) {
            closeMenu();
        }
    });
}

/* ==========================================================
   04. ACTIVE SECTION TRACKING
   ========================================================== */

/**
 * Initializes the active section indicator in the sidebar.
 *
 * Requires:
 * - Elements with an ID inside <main>
 * - Sidebar links using href="#section-id"
 */
function initSectionNavigation() {
    const sidebarLinks = getElements(
        '.side-rail a[href^="#"]'
    );

    if (sidebarLinks.length === 0) {
        return;
    }

    const sections = sidebarLinks
        .map((link) => {
            const sectionId = link.getAttribute("href")?.slice(1);

            if (!sectionId) {
                return null;
            }

            return document.getElementById(sectionId);
        })
        .filter(Boolean);

    if (sections.length === 0) {
        return;
    }

    /**
     * Highlights the link corresponding to the current section.
     *
     * @param {string} activeSectionId
     */
    function setActiveSection(activeSectionId) {
        sidebarLinks.forEach((link) => {
            const targetId = link.getAttribute("href")?.slice(1);
            const isActive = targetId === activeSectionId;

            link.classList.toggle("active", isActive);

            if (isActive) {
                link.setAttribute("aria-current", "location");
            } else {
                link.removeAttribute("aria-current");
            }
        });
    }

    /**
     * Finds the section currently displayed in the viewport.
     */
    function updateActiveSection() {
        const activationPoint =
            window.innerHeight * CONFIG.sectionActivationRatio;

        let currentSection = sections[0];

        sections.forEach((section) => {
            const sectionTop = section.getBoundingClientRect().top;

            if (sectionTop <= activationPoint) {
                currentSection = section;
            }
        });

        setActiveSection(currentSection.id);
    }

    // Initial position.
    updateActiveSection();

    // Track scrolling without running calculations on every event.
    let scrollTimeout = null;

    window.addEventListener(
        "scroll",
        () => {
            if (scrollTimeout !== null) {
                return;
            }

            scrollTimeout = window.setTimeout(() => {
                updateActiveSection();
                scrollTimeout = null;
            }, CONFIG.scrollThrottle);
        },
        { passive: true }
    );

    window.addEventListener("resize", updateActiveSection);
    window.addEventListener("load", updateActiveSection);
}

/* ==========================================================
   05. INTERNAL ANCHOR NAVIGATION
   ========================================================== */

/**
 * Handles same-page anchor links.
 *
 * Uses native browser navigation so that:
 * - The URL hash is updated
 * - Browser history remains functional
 * - Keyboard navigation is preserved
 */
function initAnchorNavigation() {
    const anchorLinks = getElements('a[href^="#"]');

    anchorLinks.forEach((link) => {
        link.addEventListener("click", (event) => {
            const href = link.getAttribute("href");

            if (!href || href === "#") {
                event.preventDefault();
                return;
            }

            const targetId = href.slice(1);
            const target = document.getElementById(targetId);

            if (!target) {
                return;
            }

            // The browser handles scrolling and history natively.
            // Offset is defined in CSS with scroll-padding-top.
        });
    });
}

/* ==========================================================
   06. IMAGE FALLBACKS
   ========================================================== */

/**
 * Initializes fallback displays for missing images.
 *
 * Supported structure:
 *
 * <div class="card-media">
 *     <img src="..." alt="...">
 *     <span class="missing-label">Image indisponible</span>
 * </div>
 *
 * CSS handles the .image-missing state.
 */
function initImageFallbacks() {
    const images = getElements(
        ".card-media img, .detail-visual img"
    );

    images.forEach((image) => {
        /**
         * Displays a fallback if the image cannot load.
         */
        function handleImageError() {
            const container = image.closest(
                ".card-media, .detail-visual"
            );

            if (!container) {
                return;
            }

            container.classList.add("image-missing");

            image.hidden = true;
        }

        image.addEventListener("error", handleImageError, {
            once: true,
        });

        // Detect images that failed before initialization.
        if (image.complete && image.naturalWidth === 0) {
            handleImageError();
        }
    });
}

/* ==========================================================
   07. INITIALIZATION
   ========================================================== */

/**
 * Initializes shared portfolio functionality.
 */
function initPortfolio() {
    initMobileNavigation();
    initSectionNavigation();
    initAnchorNavigation();
    initImageFallbacks();
}

if (document.readyState === "loading") {
    document.addEventListener(
        "DOMContentLoaded",
        initPortfolio,
        { once: true }
    );
} else {
    initPortfolio();
}

// Keep the selected section when the counterpart shares its anchor.
document.querySelector(".language-switch")?.addEventListener("click", (event) => {
    const link = event.target.closest("a[hreflang]");
    if (!link || link.hasAttribute("aria-current")) return;
    const destination = new URL(link.href);
    destination.hash = location.hash;
    link.href = destination.href;
});
