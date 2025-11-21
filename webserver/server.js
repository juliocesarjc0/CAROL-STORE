const http = require('http');
const path = require('path');
const fs = require('fs');
const url = require('url');

class WebServer {
    constructor(port = 3000) {
        this.port = port;
        this.publicUrl = process.env.PUBLIC_URL || `http://localhost:${port}`;
        this.createServer();
    }

    createServer() {
        this.server = http.createServer((req, res) => {
            const parsedUrl = url.parse(req.url, true);
            const pathname = parsedUrl.pathname;

            // Rota para visualizar transcript
            if (pathname.startsWith('/view/')) {
                const protocol = pathname.split('/view/')[1];
                const filePath = path.join(process.cwd(), 'transcripts', `transcript-${protocol}.html`);
                
                if (fs.existsSync(filePath)) {
                    const html = fs.readFileSync(filePath, 'utf-8');
                    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                    res.end(html);
                } else {
                    res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                    res.end(`
                        <!DOCTYPE html>
                        <html>
                        <head>
                            <title>Transcript não encontrado</title>
                            <style>
                                body {
                                    font-family: Arial, sans-serif;
                                    background: #2c2f33;
                                    color: #fff;
                                    display: flex;
                                    justify-content: center;
                                    align-items: center;
                                    height: 100vh;
                                    margin: 0;
                                }
                                .container {
                                    text-align: center;
                                    padding: 40px;
                                    background: #23272a;
                                    border-radius: 10px;
                                }
                                h1 { color: #ff0000; }
                                p { color: #99aab5; }
                            </style>
                        </head>
                        <body>
                            <div class="container">
                                <h1>❌ Transcript não encontrado</h1>
                                <p>O transcript #${protocol} não existe ou foi removido.</p>
                            </div>
                        </body>
                        </html>
                    `);
                }
            }
            // Rota para listar transcripts
            else if (pathname === '/list') {
                const transcriptsDir = path.join(process.cwd(), 'transcripts');
                
                if (!fs.existsSync(transcriptsDir)) {
                    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                    res.end('Nenhum transcript encontrado.');
                    return;
                }

                const files = fs.readdirSync(transcriptsDir)
                    .filter(file => file.endsWith('.html'))
                    .map(file => {
                        const protocol = file.replace('transcript-', '').replace('.html', '');
                        return `<li><a href="/view/${protocol}" target="_blank">Transcript #${protocol}</a></li>`;
                    })
                    .join('');

                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Lista de Transcripts</title>
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                background: #2c2f33;
                                color: #fff;
                                padding: 40px;
                            }
                            .container {
                                max-width: 800px;
                                margin: 0 auto;
                                background: #23272a;
                                padding: 30px;
                                border-radius: 10px;
                            }
                            h1 { color: #ff1493; }
                            a { color: #00ffff; text-decoration: none; }
                            a:hover { text-decoration: underline; }
                            ul { list-style: none; padding: 0; }
                            li { padding: 10px; background: #2c2f33; margin: 5px 0; border-radius: 5px; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h1>📄 Lista de Transcripts</h1>
                            <ul>${files || '<li>Nenhum transcript encontrado</li>'}</ul>
                        </div>
                    </body>
                    </html>
                `);
            }
            // Rota principal
            else if (pathname === '/') {
                res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end(`
                    <!DOCTYPE html>
                    <html>
                    <head>
                        <title>Carol Store - Transcripts</title>
                        <style>
                            body {
                                font-family: Arial, sans-serif;
                                background: #2c2f33;
                                color: #fff;
                                display: flex;
                                justify-content: center;
                                align-items: center;
                                height: 100vh;
                                margin: 0;
                            }
                            .container {
                                text-align: center;
                                padding: 40px;
                                background: #23272a;
                                border-radius: 10px;
                            }
                            h1 { color: #ff1493; }
                            p { color: #99aab5; }
                            a { color: #00ffff; text-decoration: none; }
                            a:hover { text-decoration: underline; }
                        </style>
                    </head>
                    <body>
                        <div class="container">
                            <h1>💜 Carol Store - Sistema de Transcripts</h1>
                            <p>Servidor web ativo e funcionando!</p>
                            <p><a href="/list">Ver lista de transcripts</a></p>
                        </div>
                    </body>
                    </html>
                `);
            }
            else {
                res.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
                res.end('404 - Página não encontrada');
            }
        });
    }

    start() {
        this.server.listen(this.port, () => {
            console.log(`🌐 Servidor web iniciado em: ${this.publicUrl}`);
            console.log(`📄 Visualizar transcripts: ${this.publicUrl}/list`);
        });
    }

    getTranscriptUrl(protocol) {
        return `${this.publicUrl}/view/${protocol}`;
    }
}

module.exports = WebServer;