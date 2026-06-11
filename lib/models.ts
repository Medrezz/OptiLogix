import mongoose, { Schema, model, models } from 'mongoose'

const ConversationSchema = new Schema({
  sessionId: { type: String, required: true, index: true },
  messages: [
    {
      role: { type: String, enum: ['user', 'assistant'], required: true },
      content: { type: String, required: true },
      imageUrl: { type: String },
      timestamp: { type: Date, default: Date.now },
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
})

const GeneratedGraphicSchema = new Schema({
  sessionId: { type: String, required: true, index: true },
  prompt: { type: String, required: true },
  imageUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
})

export const Conversation = models.Conversation || model('Conversation', ConversationSchema)
export const GeneratedGraphic = models.GeneratedGraphic || model('GeneratedGraphic', GeneratedGraphicSchema)
