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

    private static final int MAX_NOTES_PER_USER = 100;
    private static final int MAX_TITLE_LENGTH = 100;
    private static final int MAX_CONTENT_LENGTH = 5000;

    public List<Note> getNotesByUser(String userId) {
        List<Note> notes = noteRepository.findByUserId(userId);
        for (Note note : notes) {
            note.setContent(CryptoUtil.decrypt(note.getContent(), userId));
        }
        return notes;
    }

    public Note saveNote(Note note) {
        validateNote(note, true);

        if (note.getCreatedAt() == null) {
            note.setCreatedAt(System.currentTimeMillis());
        }

        note.setContent(CryptoUtil.encrypt(note.getContent(), note.getUserId()));
        return noteRepository.save(note);
    }

    public Note updateNote(Note note) {
        validateNote(note, false);

        Optional<Note> existingOpt = noteRepository.findById(note.getId());

        if (existingOpt.isPresent() && existingOpt.get().getUserId().equals(note.getUserId())) {
            Note existing = existingOpt.get();

            // Mantemos o createdAt original para não alterar a data de criação
            note.setCreatedAt(existing.getCreatedAt());

            // Criptografa o conteúdo da nota com base no userId antes de salvar
            String encryptedContent = CryptoUtil.encrypt(note.getContent(), note.getUserId());
            note.setContent(encryptedContent);

            return noteRepository.save(note);
        }

        throw new RuntimeException("Nota não encontrada ou não pertence ao usuário.");
    }

    public void deleteNote(String id, String userId) {
        Note note = noteRepository.findById(id).orElseThrow(() -> new RuntimeException("Nota não encontrada"));

        if (!note.getUserId().equals(userId)) {
            throw new RuntimeException("Usuário não tem permissão para excluir esta nota.");
        }

        noteRepository.delete(note);
    }

    private void validateNote(Note note, boolean isNew) {
        if (note.getTitle() != null && note.getTitle().length() > MAX_TITLE_LENGTH) {
            throw new RuntimeException("O título da nota excede o limite de 100 caracteres.");
        }

        if (note.getContent() != null && note.getContent().length() > MAX_CONTENT_LENGTH) {
            throw new RuntimeException("O conteúdo da nota excede o limite de 3000 caracteres.");
        }

        if (isNew) {
            List<Note> userNotes = noteRepository.findByUserId(note.getUserId());
            if (userNotes.size() >= MAX_NOTES_PER_USER) {
                throw new RuntimeException("Limite de 100 notas por usuário atingido.");
            }
        }
    }
}
