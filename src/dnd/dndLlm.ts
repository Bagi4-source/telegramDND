import {OpenAILlmProvider} from "../llm/provider";
import {Player} from "../types";

export class DndLlm extends OpenAILlmProvider {
    public async getNarration(players: Player[], currentPlayer: Player): Promise<string> {
        try {
            const playerStates = players
                .map((player) => `${player.name} с инициативой ${player.initiative} и здоровьем ${player.hp}`)
                .join(', ');

            const context = `В игре участвуют: ${playerStates}. Сейчас ход у ${currentPlayer.name}.`;
            const prompt = `Ты — рассказчик D&D. На основе следующей ситуации, создай увлекательное описание: ${context}`;
            return await this.sendMessage(prompt);
        } catch (error) {
            console.error('Ошибка при генерации описания:', error);
            return 'Произошла ошибка, и рассказчик потерял нить истории.';
        }
    };
}