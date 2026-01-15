import React from "react";

import feedHeaderImg from "../../img/dash/feed-header.svg";
import feedImage1 from "../../img/dash/feed-img-1.svg";
import feedImage2 from "../../img/dash/feed-img-2.svg";

import "../../style/adminFeed.css";

function Feed() {
    return (
        <div className="admin-feed-container">
            <div className="feed-header">
                <img src={feedHeaderImg} alt="header-image" />
            </div>

            <div className="feed-content">
                <b className="title">FEED DE NOVIDADES</b>

                <div className="feed-item">
                    <div className="text-wrapper">
                        <b>JORNADA EMOCIONAL</b>
                        <span>Acompanhe nossa <a href="#">Jornada Emocional</a>. Toda segunda-feira, nossa equipe compartilha as características e manifestações de emoções e sentimentos. Você consegue identificar o que está sentindo a partir dessas descrições? Visite nosso Instagram para explorar essa jornada de conosco!</span>
                    </div>
                    <div className="image-wrapper">
                        <img src={feedImage1} alt="feed-image" />
                    </div>
                </div>

                <div className="feed-item">
                    <div className="image-wrapper">
                        <img src={feedImage2} alt="feed-image" />
                    </div>
                    <div className="text-wrapper">
                        <b>EDUCAÇÃO SOCIOEMOCIONAL</b>
                        <span>A educação socioemocional é um processo contínuo e permanente que pode ser iniciado ainda nos primeiros anos de vida. Nosso Coordenador Pedagógico, Cícero Filgueira, comenta mais sobre o assunto, confira e fique por dentro do tema assistindo o vídeo em nosso <a href="#">Instagram!</a></span>
                    </div>
                </div>

                <div className="feed-item">
                    <div className="text-wrapper">
                        <b>JORNADA EMOCIONAL</b>
                        <span>Acompanhe nossa <a href="#">Jornada Emocional</a>. Toda segunda-feira, nossa equipe compartilha as características e manifestações de emoções e sentimentos. Você consegue identificar o que está sentindo a partir dessas descrições? Visite nosso Instagram para explorar essa jornada de conosco!</span>
                    </div>
                    <div className="image-wrapper">
                        <img src={feedImage1} alt="feed-image" />
                    </div>
                </div>

                <div className="feed-item">
                    <div className="image-wrapper">
                        <img src={feedImage2} alt="feed-image" />
                    </div>
                    <div className="text-wrapper">
                        <b>EDUCAÇÃO SOCIOEMOCIONAL</b>
                        <span>A educação socioemocional é um processo contínuo e permanente que pode ser iniciado ainda nos primeiros anos de vida. Nosso Coordenador Pedagógico, Cícero Filgueira, comenta mais sobre o assunto, confira e fique por dentro do tema assistindo o vídeo em nosso <a href="#">Instagram!</a></span>
                    </div>
                </div>
            </div>
            
        </div>
    )
}

export default Feed;