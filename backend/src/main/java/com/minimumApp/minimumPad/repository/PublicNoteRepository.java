package com.minimumApp.minimumPad.repository;

import com.minimumApp.minimumPad.model.PublicNote;
import org.socialsignin.spring.data.dynamodb.repository.EnableScan;
import org.springframework.data.repository.CrudRepository;

import java.util.Optional;

@EnableScan
public interface PublicNoteRepository extends CrudRepository<PublicNote, String> {
    Optional<PublicNote> findByUrl(String url);
}
