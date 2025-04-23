package com.minimumApp.minimumPad.repository;

import com.minimumApp.minimumPad.model.Note;
import org.socialsignin.spring.data.dynamodb.repository.EnableScan;
import org.springframework.data.repository.CrudRepository;

import java.util.List;

@EnableScan
public interface NoteRepository extends CrudRepository<Note, String> {
    List<Note> findByUserId(String userId);
}
