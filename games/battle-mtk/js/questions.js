/**
 * questions.js
 * Modul pembuat soal matematika, pengacak pilihan ganda, dan penentu damage per stage.
 */

/**
 * Mengacak pilihan jawaban sehingga selalu berisi 4 pilihan unik dan tidak bernilai negatif.
 * @param {number} correct - Jawaban yang benar
 * @returns {number[]} Array 4 angka unik teracak
 */
export function shuffleChoices(correct) {
  const choices = new Set([correct]);
  let attempts = 0;

  while (choices.size < 4 && attempts < 100) {
    attempts++;
    // Variasi pilihan di sekitar jawaban yang benar
    const delta = Math.floor(Math.random() * 11) - 5;
    const fake = Math.max(0, correct + delta);
    choices.add(fake);
  }

  // Jika setelah 100 loop belum 4, lengkapi dengan angka unik
  let fallbackVal = 1;
  while (choices.size < 4) {
    if (!choices.has(fallbackVal)) {
      choices.add(fallbackVal);
    }
    fallbackVal++;
  }

  const arr = Array.from(choices);
  // Fisher-Yates Shuffle
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }

  return arr;
}

/**
 * Menghasilkan soal matematika berdasarkan nomor stage.
 * @param {number} stage - Stage 1 sampai 10
 * @returns {{ soal: string, jawaban: number, pilihan: number[] }}
 */
export function generateQuestion(stage = 1) {
  let soal = "";
  let jawaban = 0;

  if (stage <= 2) {
    // Stage 1-2: Operasi + atau -, angka 1-20
    const a = Math.floor(Math.random() * 20) + 1;
    const b = Math.floor(Math.random() * 20) + 1;
    if (Math.random() > 0.5) {
      soal = `${a} + ${b}`;
      jawaban = a + b;
    } else {
      const maxVal = Math.max(a, b);
      const minVal = Math.min(a, b);
      soal = `${maxVal} - ${minVal}`;
      jawaban = maxVal - minVal;
    }
  } else if (stage <= 4) {
    // Stage 3-4: Operasi perkalian *, angka 1-10
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    soal = `${a} * ${b}`;
    jawaban = a * b;
  } else if (stage === 5) {
    // Stage 5: Campuran + - * dan pembagian bulat
    const opType = Math.floor(Math.random() * 4);
    if (opType === 0) {
      const a = Math.floor(Math.random() * 20) + 1;
      const b = Math.floor(Math.random() * 20) + 1;
      soal = `${a} + ${b}`;
      jawaban = a + b;
    } else if (opType === 1) {
      const a = Math.floor(Math.random() * 20) + 1;
      const b = Math.floor(Math.random() * 20) + 1;
      soal = `${Math.max(a, b)} - ${Math.min(a, b)}`;
      jawaban = Math.max(a, b) - Math.min(a, b);
    } else if (opType === 2) {
      const a = Math.floor(Math.random() * 10) + 1;
      const b = Math.floor(Math.random() * 10) + 1;
      soal = `${a} * ${b}`;
      jawaban = a * b;
    } else {
      const b = Math.floor(Math.random() * 9) + 2;
      const hasil = Math.floor(Math.random() * 10) + 1;
      const a = b * hasil;
      soal = `${a} / ${b}`;
      jawaban = hasil;
    }
  } else if (stage <= 7) {
    // Stage 6-7: Operasi campuran, angka 1-50
    const a = Math.floor(Math.random() * 50) + 1;
    const b = Math.floor(Math.random() * 20) + 1;
    if (Math.random() > 0.5) {
      soal = `${a} + ${b}`;
      jawaban = a + b;
    } else {
      soal = `${Math.max(a, b)} - ${Math.min(a, b)}`;
      jawaban = Math.max(a, b) - Math.min(a, b);
    }
  } else if (stage === 8) {
    // Stage 8: Soal cepat angka 1-10
    const a = Math.floor(Math.random() * 10) + 1;
    const b = Math.floor(Math.random() * 10) + 1;
    if (Math.random() > 0.5) {
      soal = `${a} + ${b}`;
      jawaban = a + b;
    } else {
      soal = `${Math.max(a, b)} - ${Math.min(a, b)}`;
      jawaban = Math.max(a, b) - Math.min(a, b);
    }
  } else {
    // Stage 9-10: Prioritas operasi, contoh "a + b * c"
    const a = Math.floor(Math.random() * 15) + 1;
    const b = Math.floor(Math.random() * 8) + 1;
    const c = Math.floor(Math.random() * 6) + 1;
    soal = `${a} + ${b} * ${c}`;
    jawaban = a + (b * c);
  }

  const pilihan = shuffleChoices(jawaban);
  return { soal, jawaban, pilihan };
}

/**
 * Menghitung base damage serangan pemain per stage.
 * @param {number} stage 
 * @returns {number}
 */
export function getDamage(stage) {
  if (stage <= 3) return 10;
  if (stage <= 7) return 20;
  return 30;
}
