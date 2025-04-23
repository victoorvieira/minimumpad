package com.minimumApp.minimumPad.controller;

import com.minimumApp.minimumPad.model.PublicNote;
import com.minimumApp.minimumPad.repository.PublicNoteRepository;
import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.UUID;

import static org.springframework.http.HttpStatus.NOT_FOUND;

//@EnableMongoRepositories(basePackageClasses = PublicNoteRepository.class)
@RestController
@RequestMapping("/api/publicnotes")
public class PublicNoteController {

    @Autowired
    private PublicNoteRepository noteRepository;

    // Endpoint para criar uma nova nota
    @CrossOrigin
    @PostMapping
    public ResponseEntity<?> createNote() {
        PublicNote note = new PublicNote();
        note.setUrl(UUID.randomUUID().toString()); // Gera uma URL única
        note.setConteudo(""); // Conteúdo inicial vazio
        note.setTitulo("Sem Titulo"); // Cria Nota com um titulo inicial "Sem Titulo"
        noteRepository.save(note); // Salva no MongoDB
        return ResponseEntity.ok(Map.of("url", note.getUrl()));
    }

    // Endpoint para buscar uma nota pelo URL
    @CrossOrigin
    @GetMapping("/{url}")
    public ResponseEntity<?> getNote(@PathVariable String url) {
        PublicNote note = noteRepository.findByUrl(url)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND));
        return ResponseEntity.ok(note);
    }

    // Endpoint para buscar o titulo de uma nota e retornar como String
    // Codigo comentado ja que o titulo esta sendo recuperado diretamente com o metodo que retorna nota
//    @CrossOrigin
//    @GetMapping("/title/{url}")
//    public String getNoteTitle(@PathVariable String url) {
//        PublicNote note = noteRepository.findByUrl(url)
//                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND));
//        return note.getTitulo();
//    }

    // Endpoint para atualizar o conteúdo de uma nota
    @CrossOrigin
    @PutMapping("/{url}")
    public ResponseEntity<?> updateNote(@PathVariable String url, @RequestBody Map<String, String> body) {
        PublicNote note = noteRepository.findByUrl(url)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND));
        note.setConteudo(body.get("conteudo"));
        note.setTitulo(body.get("titulo"));
        noteRepository.save(note);
        return ResponseEntity.ok().build();
    }

    @CrossOrigin
    @GetMapping("/health-check")
    public String helloWorld (){
        return "Up and Running!";
    }
}