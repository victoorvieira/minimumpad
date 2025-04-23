package com.minimumApp.minimumPad.service;

import com.minimumApp.minimumPad.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.userdetails.*;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CustomUserDetailsService implements UserDetailsService {

    private final UserRepository userRepository;

    @Override
    public UserDetails loadUserByUsername(String email) throws UsernameNotFoundException {
        return userRepository.findByEmail(email)
                .map(user -> User.builder()
                        .username(user.getEmail())
                        .password("") // senha não utilizada com OAuth2 + JWT
                        .authorities("ROLE_USER")
                        .accountLocked(false)
                        .accountExpired(false)
                        .credentialsExpired(false)
                        .disabled(false)
                        .build())
                .orElseThrow(() -> new UsernameNotFoundException("Usuário com email " + email + " não encontrado"));
    }
}
