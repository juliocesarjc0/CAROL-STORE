const fs = require('fs');
const path = require('path');
const discordTranscripts = require('discord-html-transcripts');

function formatDate(date) {
    const brtOffset = -3; 
    const utcOffset = date.getTimezoneOffset();
    const brtDate = new Date(date.getTime() + (utcOffset * 60000) + (brtOffset * 3600000));
  
    const day = String(brtDate.getDate()).padStart(2, '0');
    const month = String(brtDate.getMonth() + 1).padStart(2, '0'); 
    const year = brtDate.getFullYear();
    const hours = String(brtDate.getHours()).padStart(2, '0');
    const minutes = String(brtDate.getMinutes()).padStart(2, '0');
    const seconds = String(brtDate.getSeconds()).padStart(2, '0');
  
    return `${day}/${month}/${year} - ${hours}:${minutes}:${seconds}`;
}

function genProtocol(length) {
    let result = '';
    const charset = "1234567890";
    const charsetLength = charset.length;
  
    for (let i = 0; i < length; i++) {
      result += charset.charAt(Math.floor(Math.random() * charsetLength));
    }
  
    return result;
}

async function createTranscript(channel, ticketInfo) {
    try {
        const transcriptsDir = path.join(process.cwd(), 'transcripts');
        if (!fs.existsSync(transcriptsDir)) {
            fs.mkdirSync(transcriptsDir);
        }

        const attachment = await discordTranscripts.createTranscript(channel, {
            limit: -1,
            returnType: 'attachment',
            filename: `transcript-${ticketInfo.protocolo}.html`,
            saveImages: true,
            footerText: 'Carol Store - Sistema de Tickets',
            poweredBy: false
        });

        const filePath = path.join(transcriptsDir, `transcript-${ticketInfo.protocolo}.html`);
        
        const htmlContent = attachment.attachment;
        const htmlString = Buffer.isBuffer(htmlContent) ? htmlContent.toString('utf-8') : htmlContent;
        
        fs.writeFileSync(filePath, htmlString, 'utf-8');

        console.log(`✅ Transcript salvo: ${filePath}`);
        
        // Fazer upload para GitHub Gist (público e gratuito)
        let webUrl = null;
        const githubToken = process.env.GITHUB_TOKEN;
        
        if(githubToken) {
            try {
                console.log("🌐 Fazendo upload para GitHub Gist...");
                
                const response = await fetch('https://api.github.com/gists', {
                    method: 'POST',
                    headers: {
                        'Authorization': `token ${githubToken}`,
                        'Content-Type': 'application/json',
                        'Accept': 'application/vnd.github.v3+json'
                    },
                    body: JSON.stringify({
                        description: `Transcript do Ticket #${ticketInfo.protocolo} - Carol Store`,
                        public: false,
                        files: {
                            [`transcript-${ticketInfo.protocolo}.html`]: {
                                content: htmlString
                            }
                        }
                    })
                });

                if(response.ok) {
                    const gist = await response.json();
                    webUrl = gist.html_url;
                    console.log(`✅ Gist criado: ${webUrl}`);
                } else {
                    console.error("❌ Erro ao criar Gist:", await response.text());
                }
            } catch(error) {
                console.error("❌ Erro ao fazer upload:", error);
            }
        } else {
            console.warn("⚠️ GITHUB_TOKEN não configurado, transcript só ficará local");
        }
        
        return {
            attachment,
            webUrl
        };
    } catch (error) {
        console.error('❌ Erro ao criar transcript:', error);
        return null;
    }
}

module.exports = {
    formatDate,
    genProtocol,
    createTranscript
};