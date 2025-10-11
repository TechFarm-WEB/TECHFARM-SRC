class Branding {
  constructor({ logoSrc, tagline, parentElementId }) {
    this.logoSrc = logoSrc;
    this.tagline = tagline;
    this.parentElement = document.getElementById(parentElementId);
  }

  createLogoElement() {
    const img = document.createElement('img');
    img.src = this.logoSrc;
    img.alt = "Company Logo";
    img.className = 'branding-logo';
    return img;
  }

  createTaglineElement() {
    const taglineEl = document.createElement('div');
    taglineEl.className = 'branding-tagline';
    taglineEl.textContent = this.tagline;
    return taglineEl;
  }

  render() {
    const logo = this.createLogoElement();
    const tagline = this.createTaglineElement();

    this.parentElement.appendChild(logo);
    this.parentElement.appendChild(tagline);
  }
}

class Branding {
  constructor({ logoSrc, tagline, parentElementId }) {
    this.logoSrc = logoSrc;
    this.tagline = tagline;
    this.parentElement = document.getElementById(parentElementId);
  }

  createLogoElement() {
    const img = document.createElement('img');
    img.src = this.logoSrc;
    img.alt = "Company Logo";
    img.className = 'branding-logo';
    return img;
  }

  createTaglineElement() {
    const taglineEl = document.createElement('div');
    taglineEl.className = 'branding-tagline';
    taglineEl.textContent = this.tagline;
    return taglineEl;
  }

  render() {
    const logo = this.createLogoElement();
    const tagline = this.createTaglineElement();

    this.parentElement.appendChild(logo);
    this.parentElement.appendChild(tagline);
  }
}

// Instantiate and render the branding component
const companyBranding = new Branding({
  logoSrc: 'images/logo.png', // ✅ Correct relative path
  tagline: 'Empowering Tomorrow, Today.',
  parentElementId: 'app'
});

companyBranding.render();