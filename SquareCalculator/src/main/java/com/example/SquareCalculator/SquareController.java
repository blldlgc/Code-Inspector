
package com.example.SquareCalculator;

import org.springframework.web.bind.annotation.*; // Web isteği almak için gerekli
import org.springframework.web.bind.annotation.PostMapping;

@RestController // Bu sınıfın bir REST API olduğunu belirtir
@RequestMapping("/api") // Bu sınıfın /api altında çalışacağını belirtir
public class SquareController {

    @PostMapping("/square") // POST isteğiyle /api/square endpoint'ini tanımlar
    public SquareResponse getSquare(@RequestBody SquareRequest request) {
        int result = request.getNumber() * request.getNumber(); // Sayının karesini hesaplar
        return new SquareResponse(result); // JSON olarak geri döner
    }
}
