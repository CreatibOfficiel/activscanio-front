export interface RaceAnalysisResult {
    results: Array<{
      competitorId: string;
      rank12: number;
      score: number;
    }>;
  }
  
  export class RaceAnalysisRepository {
    constructor(private baseUrl: string) {}
  
    // POST /race-analysis/upload
    async uploadImageForAnalysis(
      image: File,
      competitorIds: string[]
    ): Promise<RaceAnalysisResult> {
      const formData = new FormData();
      formData.append("image", image);
      formData.append("competitorIds", competitorIds.join(","));
  
      const response = await fetch(`${this.baseUrl}/race-analysis/upload`, {
        method: "POST",
        body: formData,
      });
  
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Erreur lors de l'analyse de l'image : ${errorText}`);
      }
  
      return await response.json();
    }
  }
  