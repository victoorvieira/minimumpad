package com.minimumApp.minimumPad.repository;

import com.minimumApp.minimumPad.model.Note;
import org.springframework.data.mongodb.repository.MongoRepository;
import java.util.Optional;

public interface NoteRepository extends MongoRepository<Note, String> {
    Optional<Note> findByUrl(String url);

}