import { auth } from "@/config/firebase.ts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { signOut } from 'firebase/auth';
import { useState } from 'react';

const handleLogout = async () => {
    try {
        await signOut(auth); // Firebase'den çıkış işlemi
    } catch (error) {
        console.error('Logout failed: ', error);
    }
};

const MainPage = () => {
    const [number, setNumber] = useState(''); // Kullanıcıdan alınan sayı
    const [result, setResult] = useState(null); // API'den dönen sonuç

    const calculateSquare = async () => {
        try {
            const response = await fetch('http://localhost:8080/api/square', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ number: parseInt(number) })
            });
            const data = await response.json();
            setResult(data.square); // Sonucu state'e ata
        } catch (error) {
            console.error('API request failed: ', error);
        }
    };

    return (
        <div className= "flex flex-col items-center justify-center ">
            <h1>Main Page</h1>
            <button onClick={handleLogout}>Logout</button>

            <div className= "flex flex-col items-center justify-center ">
                <Input
                    type="number"
                    value={number}
                    onChange={(e) => setNumber(e.target.value)}
                    placeholder="Enter a number"
                />
                <Button className="w-full" type="submit"onClick={calculateSquare}>Calculate Square</Button>
            </div>

            {result !== null && <h2>Result: {result}</h2>}
        </div>
    );
}

export default MainPage;
