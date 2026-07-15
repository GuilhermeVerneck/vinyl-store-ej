const express = require('express');
const session = require('express-session');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));
app.use(express.json());

app.use(
    session({
        secret: process.env.SESSION_SECRET || 'chave-vinil-token-2026',
        resave: false,
        saveUninitialized: true,
        cookie: {
            maxAge: 24 * 60 * 60 * 1000
        }
    })
);

const lerDiscos = () => {
    const dados = fs.readFileSync(
        path.join(__dirname, 'data', 'discos.json'),
        'utf-8'
    );
    return JSON.parse(dados);
};

app.get('/api/discos', (req, res) => {
    try {
        const discos = lerDiscos();
        res.json(discos);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao carregar o catálogo.' });
    }
});

app.get('/api/discos/:id', (req, res) => {
    try {
        const discos = lerDiscos();
        const discoAtual = discos.find(d => d.id === req.params.id);

        if (!discoAtual) {
            return res.status(404).json({ error: 'Disco não encontrado.' });
        }

        if (!req.session.tagsVistas) {
            req.session.tagsVistas = [];
        }

        discoAtual.tags.forEach(tag => {
            if (!req.session.tagsVistas.includes(tag)) {
                req.session.tagsVistas.push(tag);
            }
        });

        const recomendacoes = discos
            .filter(d => d.id !== discoAtual.id)
            .map(d => {
                const afinidadeDireta =
                    d.tags.filter(tag => discoAtual.tags.includes(tag)).length * 2;
                const afinidadeHistorico =
                    d.tags.filter(tag => req.session.tagsVistas.includes(tag)).length * 1;
                return { ...d, score: afinidadeDireta + afinidadeHistorico };
            })
            .filter(d => d.score > 0)
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);

        res.json({ disco: discoAtual, recomendacoes });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao processar recomendações.' });
    }
});

app.post('/api/carrinho', (req, res) => {
    const { discoId } = req.body;

    if (!req.session.carrinho) {
        req.session.carrinho = [];
    }

    const itemExistente = req.session.carrinho.find(item => item.discoId === discoId);

    if (itemExistente) {
        itemExistente.quantidade += 1;
    } else {
        req.session.carrinho.push({ discoId, quantidade: 1 });
    }

    const totalItens = req.session.carrinho.reduce((soma, item) => soma + item.quantidade, 0);
    res.json({ totalItens });
});

app.get('/api/carrinho/total', (req, res) => {
    const carrinho = req.session.carrinho || [];
    const totalItens = carrinho.reduce((soma, item) => soma + item.quantidade, 0);
    res.json({ totalItens });
});

app.get('/api/carrinho/itens', (req, res) => {
    try {
        const carrinho = req.session.carrinho || [];
        const discos = lerDiscos();

        const itensDetalhados = carrinho
            .map(item => {
                const disco = discos.find(d => d.id === item.discoId);
                if (!disco) return null;
                return { ...disco, discoId: disco.id, quantidade: item.quantidade };
            })
            .filter(Boolean);

        res.json(itensDetalhados);
    } catch (error) {
        res.status(500).json({ error: 'Erro ao carregar itens do carrinho.' });
    }
});

app.post('/api/carrinho/atualizar', (req, res) => {
    try {
        const { discoId, quantidade } = req.body;

        if (!req.session.carrinho) {
            return res.status(400).json({ error: 'Carrinho vazio.' });
        }

        if (quantidade < 1) {
            req.session.carrinho = req.session.carrinho.filter(item => item.discoId !== discoId);
        } else {
            const item = req.session.carrinho.find(item => item.discoId === discoId);
            if (item) item.quantidade = quantidade;
        }

        const totalItens = req.session.carrinho.reduce((soma, item) => soma + item.quantidade, 0);
        res.json({ success: true, totalItens });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao atualizar quantidade.' });
    }
});

app.post('/api/carrinho/finalizar', (req, res) => {
    try {
        req.session.carrinho = [];
        res.json({ success: true, message: 'Compra processada com sucesso!' });
    } catch (error) {
        res.status(500).json({ error: 'Erro ao finalizar a compra.' });
    }
});

app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});
