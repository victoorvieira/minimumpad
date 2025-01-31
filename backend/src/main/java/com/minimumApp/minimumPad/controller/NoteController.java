package com.minimumApp.minimumPad.controller;

import com.minimumApp.minimumPad.model.Note;
import com.minimumApp.minimumPad.repository.NoteRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.mongodb.repository.config.EnableMongoRepositories;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.Map;
import java.util.UUID;

import static org.springframework.http.HttpStatus.NOT_FOUND;

@EnableMongoRepositories(basePackageClasses = NoteRepository .class)
@RestController
@RequestMapping("/api/notes")
public class NoteController {

    @Autowired
    private NoteRepository noteRepository;

    // Endpoint para criar uma nova nota
    @CrossOrigin
    @PostMapping
    public ResponseEntity<?> createNote() {
        Note note = new Note();
        note.setUrl(UUID.randomUUID().toString()); // Gera uma URL única
        note.setConteudo(""); // Conteúdo inicial vazio
        noteRepository.save(note); // Salva no MongoDB
        return ResponseEntity.ok(Map.of("url", note.getUrl()));
    }

    // Endpoint para buscar uma nota pelo URL
    @CrossOrigin
    @GetMapping("/{url}")
    public ResponseEntity<?> getNote(@PathVariable String url) {
        Note note = noteRepository.findByUrl(url)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND));
        return ResponseEntity.ok(note);
    }

    // Endpoint para atualizar o conteúdo de uma nota
    @CrossOrigin
    @PutMapping("/{url}")
    public ResponseEntity<?> updateNote(@PathVariable String url, @RequestBody Map<String, String> body) {
        Note note = noteRepository.findByUrl(url)
                .orElseThrow(() -> new ResponseStatusException(NOT_FOUND));
        note.setConteudo(body.get("conteudo"));
        noteRepository.save(note);
        return ResponseEntity.ok().build();
    }

    @CrossOrigin
    @GetMapping("/health-check")
    public String helloWorld (){
        return "Up and Running!";
    }
}