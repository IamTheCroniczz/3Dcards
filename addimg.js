// ==== Card placeholder para "adicione sua primeira imagem" ====
function showPlaceholderCard() {
  // Remove qualquer placeholder antigo
  const old = document.querySelector('.coverflow-item.placeholder');
  if (old) old.remove();
  // Cria o card placeholder
  const div = document.createElement('div');
  div.className = 'coverflow-item placeholder active';
  div.style.opacity = '1';
  div.style.zIndex = '100';
  div.style.transform = 'none';
  div.style.cursor = 'pointer'; // Adiciona cursor de clique
  div.innerHTML = `<div class="cover" style="display:flex;align-items:center;justify-content:center;height:100%;width:100%"><span style="font-size:1.2em;color:#888;text-align:center;">Adicione sua primeira imagem</span></div><div class="reflection"></div>`;
  // Adiciona evento de clique para abrir o input de imagem
  div.addEventListener('click', function() {
    if (uploadInput) uploadInput.click();
  });
  coverflow.appendChild(div);
}

function removePlaceholderCard() {
  const old = document.querySelector('.coverflow-item.placeholder');
  if (old) old.remove();
}
// ==== Seletores principais com verificações ====
function getElementOrThrow(id) {
  const el = document.getElementById(id);
  if (!el) throw new Error(`Elemento com ID '${id}' não encontrado`);
  return el;
}

const coverflow = getElementOrThrow("coverflow");
const container = document.querySelector(".coverflow-container");
if (!container) throw new Error("Elemento .coverflow-container não encontrado");

const dotsContainer = getElementOrThrow("dots");
const addImageBtn = getElementOrThrow("addImageBtn");
const uploadInput = getElementOrThrow("uploadImage");
const currentTitle = getElementOrThrow("current-title");
const currentDescription = getElementOrThrow("current-description");
const menuToggle = document.getElementById("menuToggle");
const mainMenu = document.getElementById("mainMenu");
const scrollToTopBtn = document.getElementById("scrollToTop");
let applyEffectBtn = null;
try {
  applyEffectBtn = getElementOrThrow("applyEffectBtn");
} catch (e) {
  // Se não existir, segue sem ele
  applyEffectBtn = null;
}
const downloadBtn = getElementOrThrow("downloadBtn");

// ==== Variáveis de estado ====
let currentIndex = 0;
let isAnimating = false;
let autoplayInterval = null;
let isPlaying = false;
const playIcon = document.querySelector(".play-icon");
const pauseIcon = document.querySelector(".pause-icon");

// ==== Dados iniciais de exemplo ====
const imageData = [];

// Função para mostrar ou ocultar botões, ícones de efeito e setas
function toggleButtons() {
  // Placeholder: mostra se não há imagens
  if (imageData.length === 0) {
    showPlaceholderCard();
  } else {
    removePlaceholderCard();
  }

  // Efeito: mostrar/ocultar barra de ícones de efeito
  const effectIconsBar = document.getElementById("effectIcons");
  if (effectIconsBar) {
    effectIconsBar.style.display = imageData.length > 0 ? "flex" : "none";
  }

  // Setas de navegação
  const prevBtn = document.querySelector(".nav-button.prev");
  const nextBtn = document.querySelector(".nav-button.next");
  const showArrows = imageData.length > 1;
  if (prevBtn) prevBtn.style.display = showArrows ? "flex" : "none";
  if (nextBtn) nextBtn.style.display = showArrows ? "flex" : "none";

  // Botão de aplicar efeito (caso exista)
  if (applyEffectBtn) applyEffectBtn.style.display = imageData.length > 0 ? "block" : "none";
  // Botão de download
  downloadBtn.style.display = imageData.length > 0 ? "block" : "none";
}

// ==== Função para criar cards COM EFETO PROGRESSIVO ====
function createCard(src, title = "User  Image", description = "", index) {
  return new Promise((resolve) => {
    setTimeout(() => {
      // Remove placeholder se existir
      removePlaceholderCard();
      const cardIndex = coverflow.children.length;

      // Cria elementos do card
      const div = document.createElement("div");
      div.className = "coverflow-item";
      div.style.opacity = "0"; // Começa invisível
      div.dataset.index = cardIndex;

      const coverDiv = document.createElement("div");
      coverDiv.className = "cover";

      const img = document.createElement("img");
      img.src = src;
      img.alt = title;
      img.loading = "lazy";

      coverDiv.appendChild(img);
      const reflection = document.createElement("div");
      reflection.className = "reflection";

      div.appendChild(coverDiv);
      div.appendChild(reflection);
      coverflow.appendChild(div);

      // Reflexo dinâmico
      img.onload = () => {
        reflection.style.backgroundImage = `url(${src})`;
        reflection.style.backgroundSize = "cover";
        reflection.style.backgroundPosition = "center";

        // Animação de fade-in para o novo card
        setTimeout(() => {
          div.style.transition = "opacity 0.5s ease-in-out";
          div.style.opacity = "1";
        }, 0); // Inicia a animação imediatamente
      };

      // Cria dot de navegação
      const dot = document.createElement("div");
      dot.className = "dot";
      dot.setAttribute(
        "aria-label",
        `Ir para imagem ${cardIndex + 1}: ${title}`
      );
      dot.onclick = () => goToIndex(cardIndex);
      dotsContainer.appendChild(dot);

      // Adiciona aos dados
      imageData.push({
        title,
        description,
        src, // src atual (pode ser modificado por efeito)
        originalSrc: src, // src original SEM efeito
      });

      // Exibe título e descrição após a primeira imagem ser adicionada
      if (imageData.length === 1) {
        currentTitle.textContent = title;
        currentDescription.textContent = description;
        document.querySelector(".coverflow-container").classList.add("visible");
      }

      // Atualiza o coverflow após um pequeno delay para a animação
      setTimeout(() => {
        updateCoverflow();
        toggleButtons(); // Atualiza a visibilidade dos botões
        resolve();
      }, 100); // Sincroniza com a animação de fade-in
    }, index * 200); // Delay entre cada imagem
  });
}

// ==== Função para atualizar o coverflow ====
function updateCoverflow() {
  if (isAnimating) return;
  isAnimating = true;

  const items = document.querySelectorAll(".coverflow-item");
  const dots = document.querySelectorAll(".dot");

  if (items.length === 0) {
    isAnimating = false;
    return;
  }

  items.forEach((item, index) => {
    let offset = index - currentIndex;

    // Ajuste para navegação circular
    if (offset > Math.floor(items.length / 2)) offset -= items.length;
    if (offset < -Math.floor(items.length / 2)) offset += items.length;

    const absOffset = Math.abs(offset);
    const sign = Math.sign(offset);

    // Cálculos de transformação 3D
    let translateX = offset * 220;
    let translateZ = -absOffset * 200;
    let rotateY = -sign * Math.min(absOffset * 60, 60);
    let opacity = Math.max(0.6, 1 - absOffset * 0.2);
    let scale = Math.max(0.8, 1 - absOffset * 0.1);

    // Efeito para itens muito distantes
    if (absOffset > 3) {
      opacity = 0;
      translateX = sign * 800;
    }

    // Aplica transformações
    item.style.transform = `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`;
    item.style.opacity = opacity;
    item.style.zIndex = 100 - absOffset;
    item.classList.toggle("active", index === currentIndex);
  });

  // Atualiza dots de navegação
  dots.forEach((dot, index) => {
    dot.classList.toggle("active", index === currentIndex);
    dot.setAttribute("aria-current", index === currentIndex ? "true" : "false");
  });

  // Atualiza informações do item atual
  if (imageData[currentIndex]) {
    currentTitle.textContent = imageData[currentIndex].title;
    currentDescription.textContent = imageData[currentIndex].description;
  }

  // Reseta estado de animação
  setTimeout(() => {
    isAnimating = false;
  }, 600);
}

// ==== Funções de navegação ====
function navigate(direction) {
  if (isAnimating || !container) return;

  const items = document.querySelectorAll(".coverflow-item");
  if (items.length === 0) return;

  currentIndex += direction;

  // Navegação circular
  if (currentIndex < 0) {
    currentIndex = items.length - 1;
  } else if (currentIndex >= items.length) {
    currentIndex = 0;
  }

  updateCoverflow();
}

function goToIndex(index) {
  if (isAnimating || index === currentIndex) return;

  const items = document.querySelectorAll(".coverflow-item");
  if (index < 0 || index >= items.length) {
    throw new Error("Índice fora dos limites");
  }

  currentIndex = index;
  updateCoverflow();
}

// ==== Eventos do input de imagem ====
if (uploadInput) {
  uploadInput.addEventListener("change", async () => {
    if (!uploadInput.files || uploadInput.files.length === 0) return;

    // Ocultar o botão de download ao adicionar uma nova imagem
    downloadBtn.style.display = "none";
    if (applyEffectBtn) applyEffectBtn.style.display = "none";

    const files = Array.from(uploadInput.files);
    stopAutoplay(); // Pausa o autoplay durante o carregamento

    // Adiciona cada imagem com um pequeno atraso entre elas
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file.type.match("image.*")) {
        console.warn("Arquivo não é uma imagem:", file.name);
        continue;
      }

      const reader = new FileReader();
      reader.onload = async (e) => {
        await createCard(
          e.target.result,
          file.name.replace(/\.[^/.]+$/, ""),
          "",
          i
        );
      };
      reader.readAsDataURL(file);
    }

    uploadInput.value = "";
  });
}

// ==== Controles de Autoplay ====
function startAutoplay() {
  if (autoplayInterval) return;
  isPlaying = true;

  if (playIcon) playIcon.style.display = "none";
  if (pauseIcon) pauseIcon.style.display = "block";

  autoplayInterval = setInterval(() => {
    navigate(1);
  }, 4000);
}

function stopAutoplay() {
  if (!autoplayInterval) return;
  isPlaying = false;

  clearInterval(autoplayInterval);
  autoplayInterval = null;

  if (playIcon) playIcon.style.display = "block";
  if (pauseIcon) pauseIcon.style.display = "none";
}

function toggleAutoplay() {
  isPlaying ? stopAutoplay() : startAutoplay();
}

// ==== Eventos de Touch/Swipe ====
if (container) {
  let touchStartX = 0;
  let touchEndX = 0;
  let isSwiping = false;

  container.addEventListener(
    "touchstart",
    (e) => {
      touchStartX = e.changedTouches[0].screenX;
      isSwiping = true;
      stopAutoplay();
    },
    { passive: true }
  );

  container.addEventListener(
    "touchend",
    (e) => {
      if (!isSwiping) return;
      touchEndX = e.changedTouches[0].screenX;

      const diff = touchStartX - touchEndX;
      if (Math.abs(diff) > 30) {
        diff > 0 ? navigate(1) : navigate(-1);
      }

      isSwiping = false;
    },
    { passive: true }
  );
}

// ==== Eventos de Teclado ====
if (container) {
  container.addEventListener("keydown", (e) => {
    if (e.key === "ArrowLeft") {
      navigate(-1);
      e.preventDefault();
    }
    if (e.key === "ArrowRight") {
      navigate(1);
      e.preventDefault();
    }
  });

  container.setAttribute("tabindex", "0");
}

// ==== Menu Mobile ====
if (menuToggle && mainMenu) {
  menuToggle.addEventListener("click", () => {
    menuToggle.classList.toggle("active");
    mainMenu.classList.toggle("active");
  });
}

// ==== Scroll e menu ativo ====
if (scrollToTopBtn) {
  scrollToTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

function handleScroll() {
  const scrollPos = window.scrollY + 100;
  const sections = document.querySelectorAll(".section");
  const menuItems = document.querySelectorAll(".menu-item");
  const header = document.getElementById("header");

  if (header) {
    header.classList.toggle("scrolled", window.scrollY > 50);
  }

  if (scrollToTopBtn) {
    scrollToTopBtn.classList.toggle("visible", window.scrollY > 500);
  }

  sections.forEach((section, i) => {
    if (
      scrollPos >= section.offsetTop &&
      scrollPos < section.offsetTop + section.clientHeight
    ) {
      menuItems.forEach((it) => it.classList.remove("active"));
      if (menuItems[i]) menuItems[i].classList.add("active");
    }
  });
}

window.addEventListener("scroll", handleScroll);

// ==== Inicialização ====
function init() {
  // O coverflow começa vazio, sem imagens
  currentTitle.textContent = "Adicione sua primeira imagem!";
  currentDescription.textContent = "Nenhuma imagem adicionada ainda.";
  toggleButtons(); // Mostra o placeholder e oculta botões, ícones e setas
}

// Inicializa quando o DOM estiver pronto
if (document.readyState === "complete") {
  init();
} else {
  document.addEventListener("DOMContentLoaded", init);
}

// ==== Funções de efeitos de imagem ====
function effectFujifilm(data) {
  for (let i = 0; i < data.length; i += 4) {
    let r = data[i];
    let g = data[i + 1];
    let b = data[i + 2];
    r = r * 1.25;
    g = g * 1.15;
    b = b * 1.2;
    const brightness = (r + g + b) / 3;
    if (brightness < 128) {
      r *= 0.9;
      g *= 0.9;
      b *= 0.9;
    }
    g += 15;
    b += 20;
    const avg = (r + g + b) / 3;
    r = (r + avg) / 2;
    g = (g + avg) / 2;
    b = (b + avg) / 2;
    const noise = (Math.random() - 0.5) * 35;
    r += noise;
    g += noise;
    b += noise;
    data[i] = Math.min(255, Math.max(0, r));
    data[i + 1] = Math.min(255, Math.max(0, g));
    data[i + 2] = Math.min(255, Math.max(0, b));
  }
}


// ==== Novos efeitos inspirados no Dazz Cam ====
function effectD3D(data, width, height) {
  // Efeito "3D" com deslocamento de canais RGB e leve blur
  const offset = 6; // deslocamento menor pra não distorcer demais
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;

      // Red channel deslocado para a esquerda
      if (x - offset >= 0) {
        data[idx] = data[idx - offset * 4];
      }

      // Blue channel deslocado para a direita
      if (x + offset < width) {
        data[idx + 2] = data[idx + offset * 4 + 2];
      }

      // Leve blur no canal verde
      if (x > 0) {
        data[idx + 1] = (data[idx + 1] + data[idx + 1 - 4]) / 2;
      }
    }
  }
}

function effectVHS(data, width, height) {
  // Efeito VHS: linhas horizontais, distorção de cor e ruído forte
  for (let y = 0; y < height; y++) {
    const vhsLine = (y % 5 === 0);
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      if (vhsLine) {
        data[idx] = Math.min(255, data[idx] * 0.7 + 60); // R
        data[idx + 1] = Math.min(255, data[idx + 1] * 0.7 + 40); // G
        data[idx + 2] = Math.min(255, data[idx + 2] * 0.5 + 100); // B
      }
      // Ruído forte
      if (Math.random() < 0.03) {
        data[idx] = Math.min(255, data[idx] + 50);
        data[idx + 1] = Math.min(255, data[idx + 1] + 50);
        data[idx + 2] = Math.min(255, data[idx + 2] + 50);
      }
    }
  }
}

function effectPretoBranco(data, width, height) {
  // Efeito preto e branco clássico
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const avg = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      data[idx] = avg;
      data[idx + 1] = avg;
      data[idx + 2] = avg;
    }
  }
}

function effectLomo(data, width, height) {
  // Efeito preto e branco clássico (substituindo Lomo)
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const avg = (data[idx] + data[idx + 1] + data[idx + 2]) / 3;
      data[idx] = avg;
      data[idx + 1] = avg;
      data[idx + 2] = avg;
    }
  }
}

// Novo efeito "Cyberpunk" para substituir o Polaroid
function effectCyberpunk(data, width, height) {
  // Realça magentas, azuis e verdes, adiciona brilho e contraste
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      let r = data[idx], g = data[idx + 1], b = data[idx + 2];
      // Contraste
      r = 1.3 * (r - 128) + 128;
      g = 1.3 * (g - 128) + 128;
      b = 1.3 * (b - 128) + 128;
      // Realce magenta e azul
      r += 30;
      b += 50;
      g += 10;
      // Glow neon
      if ((x + y) % 12 === 0) {
        r += 40;
        b += 40;
      }
      // Limita valores
      data[idx] = Math.min(255, Math.max(0, r));
      data[idx + 1] = Math.min(255, Math.max(0, g));
      data[idx + 2] = Math.min(255, Math.max(0, b));
    }
  }
}

// Salva o src original da imagem ativa para permitir resetar o efeito
function applyEffect(effectName) {
  const currentItem = document.querySelector(".coverflow-item.active img");
  const activeCard = document.querySelector(".coverflow-item.active");
  if (!currentItem || !activeCard) return;

  const index = parseInt(activeCard.dataset.index, 10);
  const data = imageData[index];
  if (!data || !data.originalSrc) return;

  const img = new Image();
  img.src = data.originalSrc;

  img.onload = function () {
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = img.width;
    canvas.height = img.height;

    // desenha a imagem original
    ctx.drawImage(img, 0, 0);

    // pega os pixels
    const imageDataCanvas = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const d = imageDataCanvas.data;

    // aplica o efeito escolhido
    switch (effectName) {
      case "fujifilm":
        effectFujifilm(d);
        break;
      case "d3d":
        effectD3D(d, canvas.width, canvas.height);
        break;
      case "vhs":
        effectVHS(d, canvas.width, canvas.height);
        break;
      case "pretoebranco":
        effectPretoBranco(d, canvas.width, canvas.height);
        break;
      case "lomo":
        effectLomo(d, canvas.width, canvas.height);
        break;
      case "cyberpunk":
        effectCyberpunk(d, canvas.width, canvas.height);
        break;
      default:
        // nenhum efeito → mantem original
        ctx.drawImage(img, 0, 0);
        break;
    }

    // atualiza o canvas com os pixels modificados
    ctx.putImageData(imageDataCanvas, 0, 0);

    // troca a imagem do card ativo pelo resultado
    currentItem.src = canvas.toDataURL();
  };
}

// Função para baixar a imagem
function downloadImage(imageSrc) {
  const link = document.createElement("a");
  link.href = imageSrc;
  link.download = "imagem-modificada.png";
  link.click();
}

// ==== Seleção de efeito por ícone e aplicação automática ====
let selectedEffect = "fujifilm";
const effectIcons = document.getElementById("effectIcons");

// Garante que o botão de adicionar imagem sempre funcione

// Garante que o evento só será adicionado após o DOM estar pronto
function setupAddImageBtn() {
  if (addImageBtn && uploadInput) {
    addImageBtn.addEventListener("click", (e) => {
      e.preventDefault();
      console.log("Botão de adicionar imagem clicado");
      uploadInput.click();
    });
  }
}

if (document.readyState === "complete" || document.readyState === "interactive") {
  setupAddImageBtn();
} else {
  document.addEventListener("DOMContentLoaded", setupAddImageBtn);
}

if (effectIcons) {
  // Adiciona evento individualmente para cada botão de efeito, mesmo se estiver oculto inicialmente
  const effectBtns = effectIcons.querySelectorAll('.effect-icon');
  effectBtns.forEach((btn) => {
    btn.type = 'button'; // Garante que não é submit
    btn.style.cursor = 'pointer';
    btn.disabled = false;
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      console.log('Clicou no efeito:', btn.getAttribute('data-effect'));
      // Remover seleção anterior
      effectBtns.forEach((b) => b.classList.remove('selected'));
      btn.classList.add('selected');
      selectedEffect = btn.getAttribute('data-effect');
      // Aplica o efeito SEMPRE a partir do original salvo no array
      applyEffect(selectedEffect);
    });
  });
}

// Evento para o botão de download
if (downloadBtn) {
  downloadBtn.addEventListener("click", () => {
    const currentItem = document.querySelector(".coverflow-item.active img");
    if (currentItem) {
      downloadImage(currentItem.src);
    }
  });
}
