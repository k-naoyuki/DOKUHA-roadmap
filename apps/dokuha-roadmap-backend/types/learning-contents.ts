export type CreateLearningContent = {
    userId: string;
    title: string;
    totalPage: number;
    currentPage?: number;
    note?: string;
};

export type UpdateLearningContent = {
    title?: string;
    totalPage?: number;
    currentPage?: number;
    note?: string;
};

export type LearningContent = {
    id: string;
    userId: string;
    title: string;
    totalPage: number;
    currentPage: number;
    note: string;
    createdAt: string;
    updatedAt: string;
};
