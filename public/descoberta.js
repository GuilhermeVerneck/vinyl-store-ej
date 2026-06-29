document.addEventListener('DOMContentLoaded', async () => {
    const cardDescoberta = document.getElementById('card-descoberta');
    const descobertaCapa = document.getElementById('descoberta-capa');
    const descobertaNome = document.getElementById('descoberta-nome');
    const descobertaArtista = document.getElementById('descoberta-artista');
    const descobertaPlayer = document.getElementById('descoberta-player');
    const btnGostei = document.getElementById('btn-gostei');
    const btnProximo = document.getElementById('btn-proximo');
    const descobertaFim = document.getElementById('descoberta-fim');
    const btnReiniciar = document.getElementById('btn-reiniciar');
    const contadorEl = document.getElementById('contador-descoberta');
    const cartContador = document.getElementById('cart-contador');

    let fila = [];
    let indiceAtual = 0;

    // carrega contador do carrinho
    try {
        const res = await fetch('/api/carrinho/total');
        const dados = await res.json();
        cartContador.textContent = dados.totalItens;
    } catch (e) {}

    // carrega e embaralha os discos
    async function inicializar() {
        try {
            const resposta = await fetch('/api/discos');
            const discos = await resposta.json();
            fila = embaralhar(discos);
            indiceAtual = 0;
            mostrarDisco();
        } catch (erro) {
            console.error('Erro ao carregar discos:', erro);
        }
    }

    function embaralhar(arr) {
        const copia = [...arr];
        for (let i = copia.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [copia[i], copia[j]] = [copia[j], copia[i]];
        }
        return copia;
    }

    function mostrarDisco() {
        if (indiceAtual >= fila.length) {
            cardDescoberta.classList.add('escondido');
            descobertaFim.classList.remove('escondido');
            contadorEl.textContent = '';
            return;
        }

        const disco = fila[indiceAtual];

        descobertaCapa.src = disco.capa;
        descobertaCapa.alt = disco.nome;
        descobertaNome.textContent = disco.nome;
        descobertaArtista.textContent = `${disco.artista} · R$ ${disco.preco.toFixed(2)}`;

        descobertaPlayer.innerHTML = `
            <iframe
                src="https://open.spotify.com/embed/track/${disco.spotifyTrackId}"
                width="100%"
                height="152"
                frameborder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy">
            </iframe>
        `;

        contadorEl.textContent = `${indiceAtual + 1} de ${fila.length}`;

        // animação de entrada
        cardDescoberta.classList.remove('animando');
        void cardDescoberta.offsetWidth; // força reflow
        cardDescoberta.classList.add('animando');

        cardDescoberta.classList.remove('escondido');
        descobertaFim.classList.add('escondido');
    }

    btnProximo.addEventListener('click', () => {
        indiceAtual++;
        mostrarDisco();
    });

    btnGostei.addEventListener('click', () => {
        const disco = fila[indiceAtual];
        // redireciona para o catálogo já abrindo o disco
        window.location.href = `/disco/${disco.id}`;
    });

    btnReiniciar.addEventListener('click', () => {
        fila = embaralhar(fila);
        indiceAtual = 0;
        mostrarDisco();
    });

    await inicializar();

    document.documentElement.dataset.vtDirection
});