import type { ChatModelResponse, ChatRequest } from "../schemas/chat.js";

export function explainWithTemplate(request: ChatRequest): ChatModelResponse {
  const expected = request.context.expectedResult;
  const scenario = request.context.scenarioResults[0];
  if (scenario?.result.maximumCashGapRupiah && scenario.result.maximumCashGapRupiah > 0) return { answer: `Pada simulasi ini, perubahan waktu atau nilai arus kas membuat kewajiban keluar sebelum pendapatan yang diharapkan. Kekurangan kas maksimum yang dihitung mesin adalah Rp${scenario.result.maximumCashGapRupiah.toLocaleString("id-ID")}. Hasil ini adalah simulasi berdasarkan asumsi yang ditampilkan.`, referencedSections: ["cash_gap", "scenario", "disclaimer"], disclaimerRequired: true };
  if (expected) return { answer: `Hasil mesin menunjukkan saldo minimum Rp${expected.minimumBalanceRupiah.toLocaleString("id-ID")} dan saldo akhir Rp${expected.endingBalanceRupiah.toLocaleString("id-ID")}. Angka tersebut berasal dari simulasi deterministik, bukan prediksi atau keputusan kredit.`, referencedSections: ["cash_gap", "assumptions", "disclaimer"], disclaimerRequired: true };
  return { answer: "Saya dapat menjelaskan hasil, skenario, perbandingan, dan konteks harga yang sedang ditampilkan. Hasil MusimAman tetap merupakan simulasi berdasarkan asumsi pengguna.", referencedSections: ["disclaimer"], disclaimerRequired: true };
}
