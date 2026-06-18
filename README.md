# Flappy Map

Jogo web inspirado em Flappy Bird, desenvolvido com HTML, CSS e JavaScript puro. O jogador controla um passaro, desvia de obstaculos infinitos e tenta alcancar a maior distancia possivel.

## Tecnologias utilizadas

- HTML5: estrutura da pagina e elemento `canvas`.
- CSS3: responsividade, centralizacao da tela e adaptacao para PC/celular.
- JavaScript: logica do jogo, fisica, colisao, menus, sons e pontuacao.
- Canvas API: renderizacao do mapa, personagem, obstaculos e interface.
- Web Audio via `Audio`: musica de fundo e efeito sonoro de pulo.
- LocalStorage: armazenamento do recorde e volume escolhido.

## Como instalar e executar

1. Baixe ou clone este repositorio.
2. Abra a pasta do projeto.
3. Execute o arquivo `index.html` em qualquer navegador moderno.

Tambem e possivel abrir com uma extensao como Live Server no VS Code.

## Como hospedar no GitHub Pages

1. Crie um repositorio publico no GitHub.
2. Envie todos os arquivos do projeto para o repositorio.
3. No GitHub, acesse `Settings`.
4. Entre em `Pages`.
5. Em `Source`, selecione a branch principal, geralmente `main`.
6. Escolha a pasta raiz `/root`.
7. Salve e aguarde o GitHub gerar o link do site.

## Estrutura do projeto

```text
trabalho_jogo/
|-- index.html
|-- styles.css
|-- scripts.js
|-- README.md
`-- assets/
    |-- mapa.png
    |-- sprites.png
    |-- sprites_config.png
    |-- music.mp3
    `-- sfx_wing.mp3
```

## Funcionamento do sistema

O jogo possui uma tela inicial com botao de play e botao de configuracoes. Para iniciar a partida, o jogador precisa clicar ou tocar diretamente no botao play.

Durante a partida, o passaro pula quando o jogador clica, toca na tela ou usa a tecla espaco/seta para cima. Os obstaculos sao gerados infinitamente, com posicoes aleatorias e abertura controlada para manter o jogo possivel.

Quando ocorre colisao com o chao, teto ou obstaculos, o jogo mostra a tela de Game Over com distancia, tempo, recorde, botao de reiniciar e botao para voltar ao inicio.

## Controles

- Mouse: clicar no play para iniciar e clicar na tela para pular.
- Celular: tocar no play para iniciar e tocar na tela para pular.
- Teclado: espaco ou seta para cima para pular durante a partida.

## Recursos implementados

- Mapa com rolagem infinita.
- Obstaculos infinitos com abertura aleatoria.
- Animacao do passaro por sprites.
- Tela inicial.
- Tela de configuracoes.
- Controle de volume.
- Musica de fundo em loop.
- Som de pulo.
- Tela de Game Over.
- Botao para reiniciar.
- Botao para voltar ao inicio.
- Recorde salvo no navegador.
- Compatibilidade com PC e celular.

## Documentacao interna do codigo

O codigo possui comentarios diretamente nos arquivos `index.html`, `styles.css` e `scripts.js`, explicando as partes principais da estrutura, responsividade, fisica, colisao e renderizacao.

Abaixo esta um trecho comentado da logica principal do jogo:

```js
// Atualiza fisica, distancia, animacoes e geracao infinita dos obstaculos.
function update(dt, now) {
  // Move o fundo para criar sensacao de movimento.
  state.bgX -= PIPE_SPEED * 0.18 * dt;

  // Depois da tela "Get Ready", a partida entra em modo jogavel.
  if (state.mode === "ready" && now > state.readyUntil) {
    state.mode = "playing";
  }

  if (state.mode === "playing") {
    // Atualiza tempo, distancia e fisica vertical do passaro.
    state.time += dt;
    state.distance += PIPE_SPEED * dt * 0.12;
    state.bird.vy += GRAVITY * dt;
    state.bird.y += state.bird.vy * dt;

    // Move todos os obstaculos para a esquerda.
    state.pipes.forEach((pipe) => {
      pipe.x -= PIPE_SPEED * dt;
    });

    // Remove obstaculos que ja sairam da tela.
    while (state.pipes.length && state.pipes[0].x < -90) {
      state.pipes.shift();
    }

    // Gera um novo obstaculo quando o ultimo se aproxima da tela.
    const furthestPipeX = state.pipes.reduce((max, pipe) => Math.max(max, pipe.x), W + 45);
    if (furthestPipeX < W + PIPE_SPACING) {
      addPipe(furthestPipeX + PIPE_SPACING + random(-18, 22));
    }

    // Finaliza o jogo se houver colisao.
    if (hitGround() || hitPipes()) {
      gameOver();
    }
  }
}
```

Outro trecho importante e a criacao dos obstaculos:

```js
// Cria um obstaculo com abertura aleatoria, mas sempre dentro de uma area jogavel.
function addPipe(x) {
  const marginTop = 105;
  const marginBottom = 92;
  const gap = random(GAP_MIN, GAP_MAX);

  // Define limites para a abertura nao ficar impossivel.
  const centerMin = marginTop + gap / 2;
  const centerMax = GROUND_Y - marginBottom - gap / 2;
  const center = random(centerMin, centerMax);

  // Cada obstaculo guarda posicao horizontal, tamanho do vao e centro do vao.
  state.pipes.push({ x, gap, center, passed: false });
}
```

## Padroes adotados

- Separacao entre estrutura (`index.html`), estilo (`styles.css`) e comportamento (`scripts.js`).
- Uso de constantes para valores fixos de fisica e tamanho.
- Uso de objetos para organizar sprites, estado do jogo e areas clicaveis.
- Funcoes pequenas para separar responsabilidades.
- Comentarios nos pontos principais do codigo.

## Assets

Os arquivos visuais e sonoros ficam na pasta `assets`. Eles sao carregados localmente pelo navegador:

- `mapa.png`: imagem de fundo do mapa.
- `sprites.png`: sprites do personagem, botoes, titulos e obstaculos.
- `sprites_config.png`: sprite da engrenagem de configuracoes.
- `music.mp3`: musica de fundo.
- `sfx_wing.mp3`: som do pulo.
