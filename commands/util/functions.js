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
        
        return attachment;
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
