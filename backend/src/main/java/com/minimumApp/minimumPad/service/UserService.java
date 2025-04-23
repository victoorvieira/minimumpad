package com.minimumApp.minimumPad.service;


import com.minimumApp.minimumPad.model.User;
import com.minimumApp.minimumPad.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class UserService {

    @Autowired
    private UserRepository userRepository;

    public User processOAuthPostLogin(String email) {
        Optional<User> optionalUser = userRepository.findByEmail(email);

        if (optionalUser.isPresent()) {
            return optionalUser.get();
        } else {
            User newUser = new User();
            newUser.setEmail(email);
            // Você pode configurar outras propriedades aqui, se desejar.
            return userRepository.save(newUser);
        }
    }

    public Optional<User> findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public Optional<User> getUserById(String id) {
        return userRepository.findById(id);
    }

    public void saveUser(User user) {
        userRepository.save(user);
    }
}
