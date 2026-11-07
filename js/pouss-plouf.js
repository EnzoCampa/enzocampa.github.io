
document.addEventListener("DOMContentLoaded", () => {

    const sections = document.querySelectorAll(
        ".project-page section[id]"
    );

    const links = document.querySelectorAll(
        ".pp-sidebar .scroll-link"
    );

    const updateActiveSection = () => {
        let currentSection = sections[0]?.id;

        for (const section of sections) {
            if (section.getBoundingClientRect().top <= 160) {
                currentSection = section.id;
            }
        }

        links.forEach(link => {
            const isActive =
                link.getAttribute("href") === `#${currentSection}`;

            link.classList.toggle("active", isActive);

            if (isActive) {
                link.setAttribute("aria-current", "location");
            } else {
                link.removeAttribute("aria-current");
            }
        });
    };

    window.addEventListener("scroll", updateActiveSection, {
        passive: true
    });

    updateActiveSection();

});
