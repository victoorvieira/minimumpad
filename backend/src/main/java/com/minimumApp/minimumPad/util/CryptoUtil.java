package com.minimumApp.minimumPad.util;

import javax.crypto.Cipher;
import javax.crypto.spec.SecretKeySpec;
import java.util.Base64;

public class CryptoUtil {

    private static final String ALGORITHM = "AES";

    public static String encrypt(String data, String userId) {
        try {
            SecretKeySpec key = getKey(userId);
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.ENCRYPT_MODE, key);
            byte[] encrypted = cipher.doFinal(data.getBytes());
            return Base64.getEncoder().encodeToString(encrypted);
        } catch (Exception e) {
            throw new RuntimeException("Erro ao criptografar a nota", e);
        }
    }

    public static String decrypt(String encryptedData, String userId) {
        try {
            SecretKeySpec key = getKey(userId);
            Cipher cipher = Cipher.getInstance(ALGORITHM);
            cipher.init(Cipher.DECRYPT_MODE, key);
            byte[] decrypted = cipher.doFinal(Base64.getDecoder().decode(encryptedData));
            return new String(decrypted);
        } catch (Exception e) {
            throw new RuntimeException("Erro ao descriptografar a nota", e);
        }
    }

    private static SecretKeySpec getKey(String userId) {
        // Cria uma chave de 16 bytes (AES-128)
        byte[] keyBytes = new byte[16];
        byte[] userIdBytes = userId.getBytes();

        for (int i = 0; i < keyBytes.length; i++) {
            keyBytes[i] = i < userIdBytes.length ? userIdBytes[i] : 0;
        }

        return new SecretKeySpec(keyBytes, ALGORITHM);
    }
}
