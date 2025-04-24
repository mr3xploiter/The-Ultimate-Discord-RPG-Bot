document.addEventListener("DOMContentLoaded", () => {
  // Command category tabs
  const categoryTabs = document.querySelectorAll(".category-tab")
  const commandLists = document.querySelectorAll(".command-list")

  categoryTabs.forEach((tab) => {
    tab.addEventListener("click", () => {
      // Remove active class from all tabs and lists
      categoryTabs.forEach((t) => t.classList.remove("active"))
      commandLists.forEach((list) => list.classList.remove("active"))

      // Add active class to clicked tab
      tab.classList.add("active")

      // Show corresponding command list
      const category = tab.getAttribute("data-category")
      document.getElementById(`${category}-commands`).classList.add("active")
    })
  })

  // Mobile menu toggle
  const menuToggle = document.querySelector(".menu-toggle")
  const navLinks = document.querySelector(".nav-links")

  if (menuToggle && navLinks) {
    menuToggle.addEventListener("click", () => {
      navLinks.classList.toggle("show")
    })
  }

  // Smooth scrolling for anchor links
  document.querySelectorAll('a[href^="#"]').forEach((anchor) => {
    anchor.addEventListener("click", function (e) {
      e.preventDefault()

      const targetId = this.getAttribute("href")
      if (targetId === "#") return

      const targetElement = document.querySelector(targetId)
      if (targetElement) {
        targetElement.scrollIntoView({
          behavior: "smooth",
        })
      }

      // Close mobile menu if open
      if (navLinks.classList.contains("show")) {
        navLinks.classList.remove("show")
      }
    })
  })

  // Intersection Observer for animations
  const observerOptions = {
    threshold: 0.1,
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("animate")
      }
    })
  }, observerOptions)

  // Observe all sections
  document.querySelectorAll("section").forEach((section) => {
    observer.observe(section)
  })

  // Add animation classes
  document.querySelectorAll(".feature-card, .animal-card, .rank-tier, .testimonial-card").forEach((element) => {
    element.classList.add("fade-in")
  })
})
