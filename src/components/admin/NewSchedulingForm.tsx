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
                console.log(sessionData.session.sub);
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
                        alert("Visita agendada com sucesso!")
                        props.onClose()
                    }
                }).catch(error => {
                    console.log("Erro: ", error)
                })
    }

    return (
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
                        <input type="text" id="collegeAddress" value={selectedCollege ? selectedCollege.address : ''} readOnly />
                    </div>
                    <div className="form-wrapper container">
                        <div>
                            <label htmlFor="collegeNumber">Número</label>
                            <input type="text" id="collegeNumber" value={selectedCollege ? selectedCollege.addressNumber : ''} readOnly />
                        </div>
                        <div>
                            <label htmlFor="city">Cidade</label>
                            <input type="text" id="city" value={selectedCollege ? selectedCollege.city : ''} readOnly />
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
    )
}

export default NewSchedulingForm