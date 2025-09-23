package com.minimumApp.minimumPad.repository;

import com.minimumApp.minimumPad.model.Note;
import org.socialsignin.spring.data.dynamodb.repository.EnableScan;
import org.socialsignin.spring.data.dynamodb.repository.EnableScanCount;
import org.springframework.data.repository.CrudRepository;

import java.util.List;

@EnableScan
@EnableScanCount
public interface NoteRepository extends CrudRepository<Note, String> {
    //List<Note> findByUserId(String userId);

    // Listas notas pelo email
    List<Note> findByUserEmail(String userEmail);

    // Conta quantas notas existem para um usuário específico
    // v1.0.3
    int countByUserId(String userEmail);

    // Mapeamento para remover todas as notas de um usuario a partir do seu email
    void deleteAllByUserEmail(String userEmail);
}