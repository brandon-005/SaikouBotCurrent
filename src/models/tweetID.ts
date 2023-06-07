import { model, Schema } from 'mongoose';

import { TweetTypes } from '../TS/interfaces';

const count: Schema = new Schema({
	identifier: { type: Number },
	tweetID: { type: String },
});

export = model<TweetTypes>('TweetID', count);
