export type SurveyQuestionStat = {
    question_id: number | string
    question: string
    type: string
    responses: Record<string, number> | string[] | null
}
