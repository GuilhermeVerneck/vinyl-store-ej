document.addEventListener('DOMContentLoaded', async () => {
    const vitrinePrincipal = document.getElementById('vitrine-principal');
    const painelDetalhe = document.getElementById('painel-detalhe');
    const gridRecomendacoes = document.getElementById('grid-recomendacoes');
    const selectOrdenacao = document.getElementById('select-ordenacao');

    const detalheTitulo = document.getElementById('detalhe-titulo');
    const detalheArtista = document.getElementById('detalhe-artista');
    const detalhePreco = document.getElementById('detalhe-preco');
    const detalheTags = document.getElementById('detalhe-tags');
    const containerIframe = document.getElementById('container-iframe');
    const btnFechar = document.getElementById('btn-fechar-detalhe');

    let idDiscoAtivo = null;
    let todosDiscos = [];

    const btnFiltro = document.getElementById('btn-filtro');
    const caixaFiltro = document.getElementById('caixa-filtro');
    const filtroPrecoInput = document.getElementById('filtro-preco');
    const filtroTagsContainer = document.getElementById('filtro-tags');
    const btnAplicarFiltro = document.getElementById('btn-aplicar-filtro');
    const btnLimparFiltro = document.getElementById('btn-limpar-filtro');
    const btnFecharFiltro = document.getElementById('btn-fechar-filtro');

    const btnComprar = document.querySelector('.btn-comprar');
    const cartContador = document.getElementById('cart-contador');
    const modalAdicionado = document.getElementById('modal-adicionado');
    const btnContinuar = document.getElementById('btn-continuar');

    // Inicializa o contador do carrinho (uma única vez)
    if (cartContador) {
        cartContador.textContent = localStorage.getItem('totalCarrinho') || '0';
    }

    await carregarVitrine();

    const match = window.location.pathname.match(/\/disco\/(\w+)/);
    if (match) {
        carregarDetalhesDisco(match[1]);
    }

    async function carregarVitrine() {
        try {
            const resposta = await fetch('/api/discos');
            const discos = await resposta.json();

            todosDiscos = discos;
            montarFiltroTags(discos);

            renderizarVitrine(discos);
        } catch (erro) {
            console.error('Erro ao carregar vitrine:', erro);
        }
    }

    async function carregarDetalhesDisco(id) {
        try {
            idDiscoAtivo = id;
            const resposta = await fetch(`/api/discos/${id}`);
            const dados = await resposta.json();

            const disco = dados.disco;
            const recomendacoes = dados.recomendacoes;

            detalheTitulo.textContent = disco.nome;
            detalheArtista.textContent = `Por ${disco.artista}`;
            document.getElementById('detalhe-descricao').textContent = disco.descricao || '';
            detalhePreco.textContent = `R$ ${disco.preco.toFixed(2)}`;

            detalheTags.innerHTML = '';

            disco.tags.forEach(tag => {
                const span = document.createElement('span');
                span.className = 'tag';
                span.textContent = `#${tag}`;
                detalheTags.appendChild(span);
            });

            containerIframe.innerHTML = `
                <iframe
                    src="https://open.spotify.com/embed/album/${disco.spotifyId}"
                    width="100%"
                    height="380"
                    frameborder="0"
                    allowfullscreen=""
                    allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                    loading="lazy">
                </iframe>
            `;

            gridRecomendacoes.innerHTML = '';

            if (recomendacoes.length === 0) {
                gridRecomendacoes.innerHTML = `
                    <p class="artista">
                        Nenhuma recomendação disponível.
                    </p>
                `;
            } else {
                recomendacoes.forEach(rec => {
                    const cardRec = criarCardDisco(rec);

                    cardRec.addEventListener('click', () => {
                        carregarDetalhesDisco(rec.id);
                        window.scrollTo({
                            top: 0,
                            behavior: 'smooth'
                        });
                    });

                    gridRecomendacoes.appendChild(cardRec);
                });
            }

            const abrirPainel = () => {
                painelDetalhe.className = '';
                window.scrollTo({ top: 0, behavior: 'smooth' });
            };
            if (document.startViewTransition) {
                document.startViewTransition(abrirPainel);
            } else {
                abrirPainel();
            }
            history.pushState({ id }, '', `/disco/${id}`);
        } catch (erro) {
            console.error('Erro ao carregar detalhes:', erro);
        }
    }

    function criarCardDisco(disco) {
        const div = document.createElement('div');

        div.className = 'card-disco';

        div.innerHTML = `
            <img
                class="capa-disco"
                src="${disco.capa}"
                alt="${disco.nome}"
            >

            <div class="conteudo-card">

                <h3>${disco.nome}</h3>

                <p class="artista">
                    ${disco.artista}
                </p>

                <p class="preco">
                    R$ ${disco.preco.toFixed(2)}
                </p>

            </div>
        `;

        return div;
    }

    function renderizarVitrine(lista) {
        vitrinePrincipal.innerHTML = '';

        if (lista.length === 0) {
            vitrinePrincipal.innerHTML = `
                <p class="artista">
                    Nenhum disco encontrado com esse filtro.
                </p>
            `;
            return;
        }

        lista.forEach(disco => {
            const card = criarCardDisco(disco);

            card.addEventListener('click', () => {
                carregarDetalhesDisco(disco.id);
            });

            vitrinePrincipal.appendChild(card);
        });
    }

    function montarFiltroTags(discos) {
        const tagsUnicas = new Set();

        discos.forEach(disco => {
            disco.tags.forEach(tag => tagsUnicas.add(tag));
        });

        filtroTagsContainer.innerHTML = '';

        [...tagsUnicas].sort().forEach(tag => {
            const label = document.createElement('label');
            label.className = 'filtro-tag-item';

            label.innerHTML = `
                <input type="checkbox" value="${tag}">
                #${tag}
            `;

            filtroTagsContainer.appendChild(label);
        });
    }

    function aplicarFiltro() {
        const precoMax = parseFloat(filtroPrecoInput.value);

        const tagsSelecionadas = [...filtroTagsContainer.querySelectorAll('input:checked')]
            .map(input => input.value);

        const listaFiltrada = todosDiscos.filter(disco => {
            const passaPreco = isNaN(precoMax) || disco.preco <= precoMax;

            const passaTags = tagsSelecionadas.length === 0 ||
                tagsSelecionadas.every(tag => disco.tags.includes(tag));

            return passaPreco && passaTags;
        });

        renderizarVitrine(listaFiltrada);
    }

    function limparFiltro() {
        filtroPrecoInput.value = '';

        filtroTagsContainer.querySelectorAll('input:checked').forEach(input => {
            input.checked = false;
        });

        renderizarVitrine(todosDiscos);
    }

    btnFiltro.addEventListener('click', () => {
        caixaFiltro.classList.toggle('escondido');
    });

    btnFecharFiltro.addEventListener('click', () => {
        caixaFiltro.classList.add('escondido');
    });

    btnAplicarFiltro.addEventListener('click', aplicarFiltro);
    btnLimparFiltro.addEventListener('click', limparFiltro);

    btnComprar.addEventListener('click', async () => {
        if (!idDiscoAtivo) return;

        try {
            const resposta = await fetch('/api/carrinho', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ discoId: idDiscoAtivo })
            });

            const dados = await resposta.json();
            cartContador.textContent = dados.totalItens;

            localStorage.setItem('totalCarrinho', dados.totalItens);

            modalAdicionado.classList.remove('escondido');

        } catch (erro) {
            console.error('Erro ao adicionar ao carrinho:', erro);
        }
    });

    btnContinuar.addEventListener('click', () => {
        modalAdicionado.classList.add('escondido');
    });

    btnFechar.addEventListener('click', () => {
        const fecharPainel = () => {
            painelDetalhe.className = 'escondido';
            containerIframe.innerHTML = '';
            idDiscoAtivo = null;
        };
        if (document.startViewTransition) {
            document.startViewTransition(fecharPainel);
        } else {
            fecharPainel();
        }
        history.pushState({}, '', '/');
    });

    selectOrdenacao.addEventListener('change', () => {
        const valor = selectOrdenacao.value;
        let lista = [...todosDiscos];

        if (valor === 'preco-asc') {
            lista.sort((a, b) => a.preco - b.preco);
        } else if (valor === 'preco-desc') {
            lista.sort((a, b) => b.preco - a.preco);
        } else if (valor === 'az') {
            lista.sort((a, b) => a.nome.localeCompare(b.nome));
        }

        renderizarVitrine(lista);
    });

    window.addEventListener('popstate', (evento) => {
        if (evento.state?.id) {
            carregarDetalhesDisco(evento.state.id);
        } else {
            painelDetalhe.className = 'escondido';
            containerIframe.innerHTML = '';
            idDiscoAtivo = null;
        }
    });

    navigation.addEventListener('navigate', (e) => {
        if (e.navigationType === 'traverse' && e.destination.index < navigation.currentEntry.index) {
            document.documentElement.dataset.vtDirection = 'back';
        } else {
            delete document.documentElement.dataset.vtDirection;
        }
    });

});