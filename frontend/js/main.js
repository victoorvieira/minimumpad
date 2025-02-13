const noteIdSrc = document.getElementById("inputTexto").value;

function showBox() {
    let searchBox = document.getElementById("searchBox");
    searchBox.style.display = "flex"; // Exibe a caixa
}

function closeBox() {
    let searchBox = document.getElementById("searchBox");
    searchBox.style.display = "none"; // Exibe a caixa
}


document.getElementById('createNoteBtn').addEventListener('click', async () => {
    const response = await fetch('https://minimumpad.com/tomcat/api/notespi/notes', { method: 'POST' });
    const { url } = await response.json();
    window.location.href = `note.html?note=${url}`;
}); 


document.getElementById('searchNoteBtnSend').addEventListener('click', async () => {
    window.open(`http://localhost/note.html?note=`+document.getElementById("inputTexto").value, '_blank').focus();
});

