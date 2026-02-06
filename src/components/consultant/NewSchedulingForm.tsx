import React, { useState, useEffect } from "react";
import { checkSession } from "../../controllers/user/checkSession.controller";
import { listColleges } from "../../controllers/college/listColleges.controller";
import { listConsultants } from "../../controllers/user/listConsultants.controller";
import { createScheduling } from "../../controllers/consultant/createScheduling.controller";

import "../../style/schedulingForm.css";

type TCollege = {
	id: number,
	contract: string,
	initDate: string,
	name: string,
	partner: string,
	address: string,
	addressNumber: number,
	state: string,
	city: string,
	management: string,
	salesManager: string,
	consultor: string,
	collegeSeries: string,
	contractSeries: string,
	internalManagement: any[],
	isActive: boolean
};

type TScheduling = {
    collegeId: number,
	creatorId: number,
	institutionProfile: string,
    visitType: string,
	collegeName: string,
	collegeAddress: string,
	collegeNumber: number,
	city: string,
	manager: string,
	visitDate: string,
	initVisitTime: string,
	endVisitTime: string,
	guestConsultants: any[],
	schedulingObservations: string
}

function NewSchedulingForm(props: { opened: boolean; onClose: () => void }) {
    const [ colleges, setColleges ] = useState<Array<TCollege>>([])
    const [ consultants, setConsultants ] = useState<Array<any>>([])
    const [ selectedCollege, setSelectedCollege ] = useState<TCollege | null>(null)
    const [ selectedGuests, setSelectedGuests ] = useState<string[]>([])
    const [ schedulingData, setSchedulingData ] = useState<Partial<TScheduling>>({})
    const [ userId, setUserId ] = useState<number>(0)
    const [isError, setIsError] = useState(false);
    const [modalErrorOpen, setModalErrorOpen] = useState(false);
    const [message, setMessage] = useState("");

    function handleModalMessage(data: { isError: boolean; message: string }) {
        const messageElement = document.getElementById("warning-message") as HTMLSpanElement;

        setIsError(data.isError);
        if (messageElement) {
            messageElement.textContent = data.message;
        } else {
            setMessage(data.message);
        }
        setModalErrorOpen(true);

        setTimeout(() => setModalErrorOpen(false), 5000);
    }

    useEffect(() => {
        async function fetchColleges() {
            try {
                const collegesList = await listColleges();
                setColleges(collegesList);
            } catch (error) {
                console.error("Error fetching colleges:", error);
            }
        }

        async function fetchConsultants() {
            try {
                const consultantsList = await listConsultants();
                setConsultants(consultantsList);
            } catch (error) {
                console.error("Error fetching consultants:", error);
            }
        }

        async function getUserId() {
            try {
                const sessionData = await checkSession();
                setUserId(sessionData.session.sub);
            } catch (error) {
                console.error("Error fetching userData:", error)
            }
        }

        fetchColleges();
        fetchConsultants();
        getUserId();
    }, []);

    function handleCollegeChange(event: React.ChangeEvent<HTMLSelectElement>) {
        const collegeId = Number(event.target.value);
        const college = colleges.find(c => c.id === collegeId) || null;
        setSelectedCollege(college);
    }
    

    function handleSchedulingData(event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) {
        const { id, value } = event.target;

        setSchedulingData(prev => ({
            ...prev,
            [id]: value
        }));
    }

    async function handleSubmit() {
        if (!selectedCollege) return;

        const payload: TScheduling = {
            collegeId: selectedCollege.id,
            creatorId: userId,
            institutionProfile: schedulingData.institutionProfile || "",
            visitType: schedulingData.visitType || "",
            collegeName: selectedCollege.name,
            collegeAddress: selectedCollege.address,
            collegeNumber: selectedCollege.addressNumber,
            city: selectedCollege.city,
            manager: schedulingData.manager || "",
            visitDate: schedulingData.visitDate || "",
            initVisitTime: schedulingData.visitDate && schedulingData.initVisitTime
              ? `${schedulingData.visitDate}T${schedulingData.initVisitTime}`
              : "",
            endVisitTime: schedulingData.visitDate && schedulingData.endVisitTime
              ? `${schedulingData.visitDate}T${schedulingData.endVisitTime}`
              : "",
            guestConsultants: selectedGuests,
            schedulingObservations: schedulingData.schedulingObservations || ""
        };

        await createScheduling(payload)
                .then(response => {
                    if(response[0].insertId) {
                        handleModalMessage({ isError: false, message: "Visita agendada com sucesso!" });
                        props.onClose()
                    }
                }).catch(error => {
                    console.log("Erro: ", error)
                })
    }

    return (
        <React.Fragment>
            <div className={`scheduling-form-container ${props.opened ? 'visible' : ''}`}>
                <div className="scheduling-form">
                    <div className="scheduling-header">
                        <b>Novo agendamento</b>
                        <button onClick={props.onClose}>Voltar</button>
                    </div>

                    <div className="scheduling-body">
                    <div className="form-wrapper">
                        <label htmlFor="collegeId">Selecione a Escola</label>
                        <select id="collegeId" className="collegeId" onChange={handleCollegeChange}>
                            <option value="">Selecione uma escola</option>
                            {colleges.map((college) => (
                                <option key={college.id} value={college.id}>{college.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-wrapper">
                        <label htmlFor="collegeAddress">Endereço</label>
                        <input type="text" id="collegeAddress" value={selectedCollege ? selectedCollege.address : ''} disabled />
                    </div>
                    <div className="form-wrapper container">
                        <div>
                            <label htmlFor="collegeNumber">Número</label>
                            <input type="text" id="collegeNumber" value={selectedCollege ? selectedCollege.addressNumber : ''} disabled />
                        </div>
                        <div>
                            <label htmlFor="city">Cidade</label>
                            <input type="text" id="city" value={selectedCollege ? selectedCollege.city : ''} disabled />
                        </div>
                    </div>
                    <div className="form-wrapper">
                        <label htmlFor="manager">Selecione o Gestor Escolar</label>
                        <select id="manager" className="manager" onChange={handleSchedulingData}>
                            <option value="">Selecione um gestor</option>
                            {selectedCollege && selectedCollege.internalManagement.map((manager: any, index: number) => (
                                <option key={index} value={manager.name}>{manager.name} - {manager.role}</option>
                            ))}
                        </select>
                    </div>
                    <div className="form-wrapper">
                        <label htmlFor="institutionProfile">Perfil da Instituição</label>
                        <select name="institutionProfile" id="institutionProfile" onChange={handleSchedulingData}>
                            <option value="">Selecione um tipo</option>
                            <option value="Implantação">Implantação (Ano 1)</option>
                            <option value="Veterana">Veterana (Ano 2+)</option>
                        </select>
                    </div>
                    <div className="form-wrapper">
                        <label htmlFor="visitType">Tipo da Visita</label>
                        <select name="visitType" id="visitType" onChange={handleSchedulingData}>
                            <option value="">Selecione um tipo</option>
                            <option value="Visita Inicial">Visita Inicial</option>
                            <option value="Acompanhamento">Acompanhamento</option>
                            <option value="Capacitação">Capacitação</option>
                            <option value="Formação Inicial">Formação Inicial</option>
                            <option value="Av. Pré Teste">Avaliação Pré-Teste</option>
                            <option value="Av. Pós Teste">Avaliação Pós-Teste</option>
                            <option value="Distribuição">Distribuição</option>
                        </select>
                    </div>
                    <div className="form-wrapper container">
                        <div>
                            <label htmlFor="visitDate">Data do Agendamento</label>
                            <input type="date" id="visitDate" className="visitDate" onChange={handleSchedulingData} />
                        </div>
                        <div>
                            <label htmlFor="initVisitTime">Previsão de Início</label>
                            <input type="time" id="initVisitTime" className="initVisitTime" onChange={handleSchedulingData} />
                        </div>
                        <div>
                            <label htmlFor="endVisitTime">Previsão de Término</label>
                            <input type="time" id="endVisitTime" className="endVisitTime" onChange={handleSchedulingData} />
                        </div>
                    </div>
                    <div className="form-wrapper">
                        <label htmlFor="guestConsultants">Convidados (pode selecionar vários)</label>
                        <select
                          name="guestConsultants"
                          id="guestConsultants"
                          multiple
                          value={selectedGuests}
                          onChange={(e) => {
                            const values = Array.from(e.target.selectedOptions, option => option.value);
                            setSelectedGuests(values);
                          }}
                        >
                            <option value="">Selecione consultores convidados</option>
                            {
                                consultants.length ? consultants.map(consultant => (
                                    <option value={consultant.firstName + " " + consultant.lastName}>{consultant.firstName} {consultant.lastName}</option>
                                )) : null
                            }
                        </select>
                    </div>
                    <div className="form-wrapper">
                        <label htmlFor="schedulingObservations">Notas Adicionais</label>
                        <textarea id="schedulingObservations" className="schedulingObservations" rows={4} onChange={handleSchedulingData}></textarea>
                    </div>
                        <div className="form-wrapper">
                            <button className="submit-button" onClick={handleSubmit}>Criar Agendamento</button>
                        </div>
                    </div>
                </div>
            </div>
            <div className={`warning-container ${isError ? "error" : "success" } ${modalErrorOpen ? "open" : ""}`}>
                <button onClick={() => setModalErrorOpen(false)}>
                    <svg width="12" height="12" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path d="M12.8925 0.3025C12.5025 -0.0874998 11.8725 -0.0874998 11.4825 0.3025L6.5925 5.1825L1.7025 0.2925C1.3125 -0.0975 0.6825 -0.0975 0.2925 0.2925C-0.0975 0.6825 -0.0975 1.3125 0.2925 1.7025L5.1825 6.5925L0.2925 11.4825C-0.0975 11.8725 -0.0975 12.5025 0.2925 12.8925C0.6825 13.2825 1.3125 13.2825 1.7025 12.8925L6.5925 8.0025L11.4825 12.8925C11.8725 13.2825 12.5025 13.2825 12.8925 12.8925C13.2825 12.5025 13.2825 11.8725 12.8925 11.4825L8.0025 6.5925L12.8925 1.7025C13.2725 1.3225 13.2725 0.6825 12.8925 0.3025Z" fill="#000000"/>
                    </svg>
                </button>
                <span id="warning-message">{message}</span>
            </div>
        </React.Fragment>
    )
}

export default NewSchedulingForm