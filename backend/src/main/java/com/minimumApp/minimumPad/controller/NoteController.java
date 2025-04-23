package com.minimumApp.minimumPad.controller;


import com.minimumApp.minimumPad.model.Note;
import com.minimumApp.minimumPad.service.JwtService;
import com.minimumApp.minimumPad.service.NoteService;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notes")
@RequiredArgsConstructor
public class NoteController {

    private final NoteService noteService;
    private final JwtService jwtService;

    // Exceção personalizada para token inválido ou expirado
    public static class UnauthorizedException extends RuntimeException {
        public UnauthorizedException(String message) {
            super(message);
        }
    }

    // Método para extrair o usuário do token presente no header Authorization
    private String getUserIdFromRequest(HttpServletRequest request) {
        String authHeader = request.getHeader("Authorization");
        String token = (authHeader != null && authHeader.startsWith("Bearer "))
                ? authHeader.substring(7)
                : null;

        if (token == null) {
            throw new UnauthorizedException("Token não fornecido.");
        }

        try {
            return jwtService.getUsernameFromToken(token);
        } catch (Exception e) {
            throw new UnauthorizedException("Token inválido ou expirado.");
        }
    }

    // Endpoint para obter as notas do usuário
    @GetMapping
    public ResponseEntity<List<Note>> getUserNotes(HttpServletRequest request) {
        String userId = getUserIdFromRequest(request);
        List<Note> notes = noteService.getNotesByUser(userId);

        if (notes.isEmpty()) {
            return ResponseEntity.noContent().build();
        }

        return ResponseEntity.ok(notes);
    }

    // Endpoint para criar uma nova nota
    @PostMapping
    public ResponseEntity<Note> createNote(@RequestBody Note note, HttpServletRequest request) {
        String userId = getUserIdFromRequest(request);
        note.setUserId(userId);  // Associando o usuário à nota

        System.out.println("Tentando salvar nota para o usuário: " + userId);


        Note savedNote = noteService.saveNote(note);

        if (savedNote == null) {
            throw new RuntimeException("Falha ao salvar a nota.");
        }

        System.out.println("Nota salva: " + savedNote);

        return ResponseEntity.ok(savedNote);
    }

    // Endpoint para atualizar uma nota
    @PutMapping("/{id}")
    public ResponseEntity<Note> updateNote(@PathVariable("id") String id, @RequestBody Note note, HttpServletRequest request) {
        String userId = getUserIdFromRequest(request);
        note.setId(id);
        note.setUserId(userId);

        Note updatedNote = noteService.updateNote(note);

        if (updatedNote == null) {
            throw new RuntimeException("Falha ao atualizar a nota.");
        }

        return ResponseEntity.ok(updatedNote);
    }

    // Endpoint para excluir uma nota
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteNote(@PathVariable("id") String id, HttpServletRequest request) {
        String userId = getUserIdFromRequest(request);

        try {
            noteService.deleteNote(id, userId);  // Tenta excluir a nota
            return ResponseEntity.noContent().build();  // Retorna 204 No Content se for bem-sucedido
        } catch (RuntimeException e) {
            // Se a nota não for encontrada ou não puder ser excluída, retorna 404 ou 403, dependendo do caso
            return ResponseEntity.status(HttpStatus.FORBIDDEN).build();  // Ou ResponseEntity.status(HttpStatus.NOT_FOUND).build()
        }
    }
}
