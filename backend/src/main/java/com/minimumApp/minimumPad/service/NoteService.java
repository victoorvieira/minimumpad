package com.minimumApp.minimumPad.service;


import com.minimumApp.minimumPad.model.Note;
import com.minimumApp.minimumPad.repository.NoteRepository;
import com.minimumApp.minimumPad.util.CryptoUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
public class NoteService {

    private final NoteRepository noteRepository;

    public List<Note> getNotesByUser(String userId) {
        List<Note> notes = noteRepository.findByUserId(userId);
        for (Note note : notes) {
            note.setContent(CryptoUtil.decrypt(note.getContent(), userId));
        }
        return notes;
    }

    public Note saveNote(Note note) {
        note.setContent(CryptoUtil.encrypt(note.getContent(), note.getUserId()));
        return noteRepository.save(note);
    }

    public Note updateNote(Note note) {
        Optional<Note> existing = noteRepository.findById(note.getId());

        if (existing.isPresent() && existing.get().getUserId().equals(note.getUserId())) {
            // Criptografa o conteúdo da nota com base no userId antes de salvar
            String encryptedContent = CryptoUtil.encrypt(note.getContent(), note.getUserId());
            note.setContent(encryptedContent);

            return noteRepository.save(note);
        }

        throw new RuntimeException("Nota não encontrada ou não pertence ao usuário.");
    }

    public void deleteNote(String id, String userId) {
        Note note = noteRepository.findById(id).orElseThrow(() -> new RuntimeException("Nota não encontrada"));

        // Verificar se a nota pertence ao usuário autenticado
        if (!note.getUserId().equals(userId)) {
            throw new RuntimeException("Usuário não tem permissão para excluir esta nota.");
        }

        noteRepository.delete(note);
    }
}
