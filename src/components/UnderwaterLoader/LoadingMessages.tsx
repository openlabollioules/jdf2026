/** Bulle de message au-dessus de la scène ; l'animation rejoue à chaque nouveau texte. */
export function LoadingMessages({ message }: { message: string }) {
  return (
    <div className="scene-message-wrap" aria-live="polite">
      <p className="scene-message" key={message}>
        {message}
      </p>
    </div>
  );
}
