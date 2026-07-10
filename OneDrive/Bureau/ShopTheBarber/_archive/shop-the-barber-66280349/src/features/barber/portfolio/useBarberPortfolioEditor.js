export function useBarberPortfolioEditor() {
    const portfolioItems = [
        { id: 1, type: "image", url: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=400", title: "Fade Classique", likes: 45 },
        { id: 2, type: "image", url: "https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=400", title: "Coupe Moderne", likes: 67 },
        { id: 3, type: "video", url: "", title: "Tutoriel Dégradé", likes: 123 },
        { id: 4, type: "image", url: "https://images.unsplash.com/photo-1605497788044-5a32c7078486?w=400", title: "Style Vintage", likes: 89 }
    ];

    return {
        portfolioItems,
        isLoading: false,
        error: null
    };
}
