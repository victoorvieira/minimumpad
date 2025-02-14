// Funcao utilizada para atualizar o numero das linhas na caixa de texto
function updateLineNumbers() {
  const lines = textarea.value.split('\n').length;
  lineNumbers.innerHTML = '';
  for (let i = 1; i <= lines; i++) {
    const lineNumber = document.createElement('span');
    lineNumber.textContent = i;
    lineNumbers.appendChild(lineNumber);
  }
}


// Funcao para carregar o conteudo da nota do banco
async function loadNote() {
  const response = await fetch(`https://minimumpad.com/tomcat/api/notes/${noteUrl}`);
  const note = await response.json();
  textContent.value = note.conteudo;
  noteTitle.textContent = note.titulo;

}

// Colocar ID da nota na barra inferior
function defineUrlBarraInferior() {
  document.getElementById('barraInferior').innerHTML = `${noteUrl}`;
}

// Funcao para baixar o conteudo como .txt
// usa o valor do titulo como nome do arquivo 
function downloadNoteBtn() {
  var text = document.getElementById("noteContent").value;
  text = text.replace(/\n/g, "\r\n"); // To retain the Line breaks.
  var blob = new Blob([text], { type: "text/plain" });
  var anchor = document.createElement("a");
  anchor.download = document.getElementById("noteTitle").innerHTML + ".txt";
  anchor.href = window.URL.createObjectURL(blob);
  anchor.target = "_blank";
  anchor.style.display = "none"; // just to be safe!
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
}


// Funcao que atualiza o conteudo da nota no banco
async function updateNote() {
  await fetch(`https://minimumpad.com/tomcat/api/notes/${noteUrl}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(
      {
        conteudo: textarea.value,
        titulo: noteTitle.textContent

      }
    )

  })
    .then(response => {
      if (response.status === 200) {
        console.log("Operação bem-sucedida!");
        showGreenBox("Operação bem-sucedida!");
      } else {
        console.log(`Erro na operação: ${response.status}`);
        showRedBox("Erro na operação!");
      }
    })
    .catch(error => {
      console.error("Erro ao fazer a requisição:", error);
      showRedBox("Erro na operação!");
    });
  ;
}

// funcao para mostrar a caixa de sucesso
// TODO: juntar com a showRedBox()
function showGreenBox(message) {
        let box = document.createElement("div");
        box.textContent = message;
        box.classList.add("green-box");

        document.body.appendChild(box);

        setTimeout(() => {
            box.remove();
        }, 3000); // Remove a caixa após 3 segundos
}

// exibe uma caixa vermelha com a mensage de erro
function showRedBox(message) {
        let box = document.createElement("div");
        box.textContent = message;
        box.classList.add("red-box");

        document.body.appendChild(box);

        setTimeout(() => {
            box.remove();
        }, 3000); // Remove a caixa após 3 segundos
}
